let fs = require('fs-extra')
let yaml = require('js-yaml')
let xml2js = require('xml2js')
var ExifImage = require('exif').ExifImage;
var inside = require('point-in-polygon');

let prom = require('./libs/prom')


//Read config file
let argv = require('yargs').option('config', {
    alias: 'c',
    description: 'Path to yml config file',
    default: './photoLocationRenamer.yml'
}).option('kml', {
    description: 'Path to kml folder'
}).option('field', {
    description: 'Name of filed in kml files to use for file name'
}).option('source', {
    description: 'Path to photos source folder'
}).option('destination', {
    description: 'Path to destination output folder'
}).argv

var configPath = argv.config
if(fs.existsSync(configPath)) {
    var configs = yaml.safeLoad(fs.readFileSync(configPath, 'utf8'))
} else {
    configs = {}
}
if(argv.kml) { configs['kml_path'] = argv.kml}
if(argv.field) { configs['kml_field_for_filename'] = argv.field}
if(argv.source) { configs['source'] = argv.source}
if(argv.destination) { configs['destination'] = argv.destination}

if(!configs['kml_path'] || !configs['kml_field_for_filename'] || !configs['source'] || !configs['destination']) {
    throw new Error('Missing configs')
}

var xmlParser = new xml2js.Parser()

var places = []

fs.readdirSync(configs['kml_path']).forEach(file => {
    var fileExtension = file.substr(file.lastIndexOf('.') + 1, file.length).toLowerCase()

    if(fileExtension != 'kml') { return; }

    xmlParser.parseString(fs.readFileSync(configs['kml_path'] + '/' + file, 'utf8'), (error, result) => {
        if(error) { console.log(error); return; }
        result.kml.Document[0].Folder[0].Placemark.forEach(placemark => {
            var simpleData = placemark.ExtendedData[0].SchemaData[0].SimpleData
            var place = {}
            simpleData.forEach(data => {
                place[data.$.name] = data._
            })

            var polygons = []
            var polygonParser = (polygon) => {
                var temp = {}

                //Parsing coordinates
                var coordinateParser = (boundaries) => {
                    var out = []
                    boundaries.forEach(boundary => {
                        var coordinates = []
                        boundary.LinearRing[0].coordinates[0].split(' ').forEach(coordinate => {
                            var split = coordinate.split(',')
                            coordinates.push({
                                lon: parseFloat(split[0]),
                                lat: parseFloat(split[1])
                            })
                        })
                        out.push(coordinates)
                    })

                    return out
                }
                temp.outer = coordinateParser(polygon.outerBoundaryIs)[0]
                if(polygon.innerBoundaryIs) {
                    temp.inner = coordinateParser(polygon.innerBoundaryIs)
                }

                polygons.push(temp)
            }

            if(placemark.MultiGeometry) {
                placemark.MultiGeometry[0].Polygon.forEach(polygon => polygonParser(polygon))
            } else {
                polygonParser(placemark.Polygon[0])
            }

            place.polygons = polygons
            places.push(place)
        })
    })
})

var photos = []
var promises = []
fs.readdirSync(configs['source']).forEach(file => {
    var fileExtension = file.substr(file.lastIndexOf('.') + 1, file.length).toLowerCase()

    if(fileExtension != 'jpg' && fileExtension != 'jpeg') { return; }
    promises.push(() => {
        return new Promise((resolve, reject) => {
            new ExifImage({ image : configs['source'] + '/' + file }, (error, exifData) => {
                if(exifData) {
                    var lat = exifData.gps.GPSLatitude[0] + (exifData.gps.GPSLatitude[1] / 60) + (exifData.gps.GPSLatitude[2] / 3600)
                    var lon = exifData.gps.GPSLongitude[0] + (exifData.gps.GPSLongitude[1] / 60) + (exifData.gps.GPSLongitude[2] / 3600)

                    var place = places.find(place => {
                        //if(place.Namn != 'Berga torrängar') { return false; }
                        var found = false
                        place.polygons.forEach(polygon => {
                            if(inside([lat, lon], polygon.outer.map(coordinate => [parseFloat(coordinate.lat), parseFloat(coordinate.lon)]))) {
                                found = true
                                /*if(polygon.inner) {
                                    polygon.inner.forEach(polygon => {
                                        if(!inside([lat, lon], polygon.map(coordinate => [coordinate.lat, coordinate.lon]))) {
                                            found = false
                                        }
                                    })
                                }*/
                            }
                        })
                        return found
                    })
                    if(place) {
                        photos.push({ file: file, fileExtension: fileExtension, place: place })
                        //console.log('Found ' + place.Namn + ' for image ' + file)
                    } else {
                        photos.push({ file: file, fileExtension: fileExtension })
                        //console.log('Could not find location for ' + file)
                    }
                    resolve();
                }
            })
        })
    })
})

prom.sequence(promises).then(() => {
    //Moving and renaming photos
    var nameCounter = {}
    var noNameCounter = 0
    photos.forEach((photo, index) => {
        var name = null
        var foundName = null
        if(configs['kml_field_for_filename'] && photo.place) {
            foundName = true
            name = photo.place[configs['kml_field_for_filename']].replace(/ /g, "_").toLowerCase();
            if(!nameCounter[name]) { nameCounter[name] = 0; }
            nameCounter[name]++
        } else {
            foundName = false
            name = 'unknown'
            noNameCounter++
        }
        var fileName = name + '_' + (foundName ? nameCounter[name] : noNameCounter) + '.' + photo.fileExtension;
        fs.copy(configs['source'] + '/' + photo.file, configs['destination'] + '/' + fileName, (error) => {
            if(error) { console.log(error); }
        })
    })
})