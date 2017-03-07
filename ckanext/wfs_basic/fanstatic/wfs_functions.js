var vmapi,map,point,box,drawControls,address,geomColumn;
$(function(){
  if (!String.prototype.startsWith){
    String.prototype.startsWith = function(searchString, position){
      position = position || 0;
      return this.substr(position, searchString.length) === searchString;
    }
   }
    

    $("#map").append("<p>jQuery works</p>");
    if (OpenLayers){
        $("#map").append("<p> OpenLayer here </p>");
    }
    $("#map").empty();
    var matrixids = new Array(19);
    for (var i = 0; i <= 18; ++i) {
       matrixids[i] = "EPSG:3857_WEB_MERCATOR:" + i;
    }

    var url = "http://api.maps.vic.gov.au/geowebcacheWM/service/wmts";
    
    vmapi = new OpenLayers.Layer.WMTS({
       name: "Vicmap API",
       url: url,
       layer: "WEB_MERCATOR",
       div: "map",
       matrixSet: "EPSG:3857_WEB_MERCATOR",
       serverResolutions: [
          156543.03392804097, 
          78271.51696402048, 
          39135.75848201024, 
          19567.87924100510000, 
          9783.93962050256000, 
          4891.96981025128000, 
          2445.98490512564000, 
          1222.99245256282000, 
          611.49622628141000, 
          305.74811314070500, 
          152.87405657035200, 
          76.43702828517620, 
          38.21851414258810, 
          19.10925707129400, 
          9.55462853564703, 
          4.77731426782351, 
          2.388657133911758, 
          1.194328566955879, 
          0.5971642834779395
       ],
       matrixIds: matrixids,
       format: "image/png",
       style: "_null",
       opacity: 1,
       isBaseLayer: true,
      maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
       //maxExtent: new OpenLayers.Bounds(15645508,-4743935,16703927,-4086454),
      // attribution: "Vicmap API © 2015 State Government of Victoria | <a href='http://api.maps.vic.gov.au/vicmapapi/Copyright.jsp' target='_blank' style='color:#4BABFA;'>Copyright and Disclaimer</a> ",
    });
    vmapi.setTileSize(new OpenLayers.Size(512,512));
    
    point = new OpenLayers.Layer.Vector("point");
    box = new OpenLayers.Layer.Vector("bbox");
    drawControls = {
        pointControl: new OpenLayers.Control.DrawFeature(point, OpenLayers.Handler.Point,{
             featureAdded: function(feature){
                 addToField(feature)
             }
        }),
        bboxControl: new OpenLayers.Control.DrawFeature(box, OpenLayers.Handler.RegularPolygon, {
             handlerOptions: {sides: 4, irregular: true},
             featureAdded: function(feature){
                 addToField(feature);
             }
        })
    };    
    map = new OpenLayers.Map({
        div: "map",
        layers: [vmapi],
        maxExtent: vmapi.getMaxExtent(),
        numZoomLevels: 19,
        projection: "EPSG:3857"
       // controls: [new OpenLayers.Control.MousePosition(),drawControls[point], drawControls[bbox]]
    });
    map.zoomToExtent(new OpenLayers.Bounds(16029487,-4607212,16261855,-4484850),true);
    //point.projection = vmapi.projection;
    //bbox.projection= vmapi.projection;
    map.addLayers([point,box]);
    map.addControls([drawControls["bboxControl"],drawControls["pointControl"]]);  

    $("#drawbbox").on("click", function(){
        console.log(".drawbbox clicked");
        $(this).addClass("active");
        drawControls["bboxControl"].activate();
    });
    $(".drawpoint").on("click", function(){
        $(this).addClass("active");
        drawControls["pointControl"].activate();
    })
    removeReduntant($("#function option:selected").val());
    $("#function").change(function(){
        $("input[name=bbox]").val("");
        var sel = $("#function option:selected").val();
        removeReduntant(sel);

    });    
    
    address = $("#wfs-function-preview").data("module-url");
    var result; 
    // Make sure you have the corect geometry column name
    $.get(address.split("?")[0]+"?request=describefeatureType&outputFormat=application/json&typename="+address.split("#")[1], function(data){
       result = data;
      // var parsed = JSON.parse(data);
       console.log(data.featureTypes);
      var x; 
      for (x in data.featureTypes[0].properties){
          if (data.featureTypes[0].properties[x].type.startsWith("gml")){
              //console.log(data.featureTypes[0].properties[x]);
              geomColumn = data.featureTypes[0].properties[x].name;
              break
          } 
      }
    });

    // if there is a WMS, use it on the map
    if (address.split("#")[1]){
        $.get(address.split("wfs")[0]+"wms?request=getMap&STYLES&SERVICE=WMS&VERSION=1.1.1&FORMAT=image/png&SRS=EPSG:3857&BBOX=16133869.306,-4503669.706,16136022.180,-4503516.832&WIDTH=256&HEIGHT=256&LAYERS="+address.split("#")[1]).success(function(){
    var wmsLayer = new OpenLayers.Layer.WMS(
        address.split("#")[1],
        address.split("wfs")[0]+"wms",
        {
            LAYERS: address.split("#")[1],
            transparent: true,
            style: "",
            srs: "EPSG:3857"
        },
        {
            tiled: true,
            width: 256,
            height: 256,
            visibilty: true,
            isBaseLayer: false,
            tileOrigin: map.baseLayer.getTileOrigin(),
            projection: "EPSG:3857",
            srs: "EPSG:3857"
        }
        
    );
    map.addLayer(wmsLayer);
})
    }
    
    $("#submit").on("click", function(){
        doSubmit(); 
    });
    
});
var gda = proj4.defs("EPSG:4283", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
function addToField(feature){
   //console.log(feature);
   var reproj = feature.geometry.transform(new OpenLayers.Projection('EPSG:3857'),new OpenLayers.Projection('EPSG:4283'));
   //console.log();
   if (feature.layer.name == "point"){
       $("input[name=bbox]").val(feature.geometry.transform(new OpenLayers.Projection("EPSG:3857"),new OpenLayers.Projection("EPSG:4326")).toString());
       feature.destroy();
       $(".drawpoint").removeClass("active");
       drawControls["pointControl"].deactivate();

   } else {
       $("input[name=bbox]").val(feature.geometry.transform(new OpenLayers.Projection("EPSG:3857"),new OpenLayers.Projection("EPSG:4326")).toString());
       feature.destroy();
       $("#drawbbox").removeClass("active");
       drawControls["bboxControl"].deactivate();

   }
}

function removeReduntant(sel){
           if (sel == "INTERSECTS" || sel == "WITHIN" || sel == "OVERLAPS"){
            $(".drawpoint").addClass("hide");
            $(".drawbbox").removeClass("hide");
            $("#dist").addClass("hide")
        }
        if (sel == "CONTAINS"){
            $(".drawpoint").removeClass("hide");
            $(".drawbbox").addClass("hide");
            $("#dist").addClass("hide")
        }
        if (sel == "DWITHIN"){
            $(".drawpoint").removeClass("hide");
            $(".drawbbox").addClass("hide");
            $("#dist").removeClass("hide")
        }

}
function doSubmit(){
    var url = address.split("?")[0];
    var typename = address.split("#")[1];
    var func = $("#function").val();
    var wkt = $("input[name=bbox]").val();
    var dist = $("input[name=dist]").val();
    var fCount = $("select[name=fcount]").val();
    console.log(fCount);
    var cql_filter = func+"("+(!geomColumn ? "SHAPE" : geomColumn)+", "+wkt+((func == "DWITHIN") ? ","+dist+",meters" : "") +")";
    var outputFormat = $("#format").val();
    var srs = $("#coord-sys").val();
    var all = url+"?"+"service=WFS&version=1.0.0&request=getFeature&typename="+typename+"&srsName="+srs+"&cql_filter="+cql_filter+"&outputFormat="+outputFormat+"&maxFeatures="+fCount;
    //console.log(all.toString());
    window.open(all, '_blank');
}

