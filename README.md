# Photo Location Renamer
Using placemarkers from specified kml-files this script can use any placemarker
extended simple data name as attribute for renaming a photo file within that
specific placemark.

Using the exif info from input photos the script determine which placemark the
photo belongs to (if any) and rename it.

## config
Config can be specfied either in a .yml file or as options passed to the script.
The four configurations that needs to be specified are:
- kml_path (--kml) - Path to the folder in which one ore multiple .kml files with placemarkers can be found
- kml_field_for_filename (--field) - Which placemarker field (found under tag `ExtendedData` > `SimpleData` within the placemarker tag) to use when renaming photos
- source (--source) - Folder where all photos the renaming should be applied to
- destination (--destination) - Folder where all renamed photos should be placed

### .yml file:
```yml
kml_path:
kml_field_for_filename:
source:
destination:
group:
```

###Options:
```bash
--config, -c   Path to yml config file [default: "./photoLocationRenamer.yml"]
--kml          Path to kml folder
--field        Name of filed in kml files to use for file name
--source       Path to photos source folder
--destination  Path to destination output folder
```
## Example

Using the following directory tree:
```bash
kml/
kml/example.kml
out/
photos/
photoLocationRenamer.yml
```
with the content of `photoLocationRenamer.yml` beeing:
```yml
kml_path: ./kml
kml_field_for_filename: Namn
source: ./photos
destination: ./out
```
and `kml/example.kml` beeing
```xml
<?xml version="1.0" encoding="utf-8" ?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document id="root_doc">
<Schema name="Lindö" id="Lindö">
	<SimpleField name="Namn" type="string"></SimpleField>
	<SimpleField name="Stadsdel" type="string"></SimpleField>
</Schema>
<Folder><name>Lindö</name>
  <Placemark>
	<Style><LineStyle><color>ff0000ff</color></LineStyle><PolyStyle><fill>0</fill></PolyStyle></Style>
	<ExtendedData><SchemaData schemaUrl="#Lindö">
		<SimpleData name="Namn">Sjöbrisen</SimpleData>
		<SimpleData name="Stadsdel">Lindö</SimpleData>
	</SchemaData></ExtendedData>
      <Polygon>
		  <altitudeMode>clampToGround</altitudeMode>
		  <outerBoundaryIs>
			  <LinearRing>
				  <altitudeMode>clampToGround</altitudeMode>
				  <coordinates>16.2656193759399,58.6016066947614 16.2661073197742,58.601457566631 16.2661081743948,58.6014583761734 16.2661447163169,58.6014468614623 16.2665395926756,58.6013248544711 16.2666149203346,58.6013005719951 16.2667204612224,58.6012593765315 16.2667777606934,58.6012302133286 16.2668823802736,58.6011723176396 16.2669445444751,58.6011358015103 16.2671083979718,58.6010421921571 16.2671671008112,58.6010088118281 16.267203891464,58.6009856263263 16.2666378969751,58.6007174257759 16.2653822697124,58.6014391884325 16.26553043941,58.601633824691 16.2656193759399,58.6016066947614</coordinates>
			  </LinearRing>
		  </outerBoundaryIs>
	  </Polygon>
  </Placemark>
</Folder>
</Document>
</kml>
```
Any photo in the `photos/` folder with exif position within the placemarker of the yml file will be copied to `out/sjöbrisen_#.jpg`
