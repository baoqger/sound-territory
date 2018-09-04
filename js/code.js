(function($, window, document) {

  extendTopoJson();

  var vlc = [39.475339, -0.376703];
  var kyoto = [34.980603, 135.761296];
  var bogota = [4.608943, -74.070867];

  var leafletMap = L.map('mapid', { // mapid is the id property of div element in index.html file
      minZoom: 1,
      maxZoom: 20
    })
    .setView(vlc)
    .setZoom(13);

  // no PIXI application object, since in this case, PIXI is working with leaflet.
  // a container represents a collection of display objects. that act as a container for other objects
  var pixiContainer = new PIXI.Container(),
    // runs an update loop that other objects listen to.
    ticker = new PIXI.ticker.Ticker(),
    firstDraw = true,
    prevZoom,
    frame = null,
    animation,
    factorScale,
    renderer,
    container;
  ticker.speed = 0.5;

  // self exectution function
  $(function() {
    // d3-fetch api support json, csv, tsv.
    d3.json('maps/vlc-map.json', function(error, datacoords) {
      if (error) throw error;
      //
      var topolayer = new L.TopoJSON();
      topolayer.addData(datacoords);// adddata method of topolayer object
      var arrGeo = [];
      for (var keys in topolayer._layers) {
        arrGeo.push(topolayer._layers[keys]._latlngs);
      }
      console.log(arrGeo)
      pixiLayer(arrGeo);

    }); //---GET DATA

  }); ///--- ON READY



  function pixiLayer(data) {

    var loader = new PIXI.loaders.Loader();
    // chainable 'add' to enqueue a resource
    loader.add('iris', 'assets/iris.png');
    // load method loads the queue of resources, and calls the passed in callback called once all resources have loaded
    loader.load(function(loader, resources) {
      // L.PixiOverlay.js support the pixioverlay methods
      // create an overlay
      // L.pixiOverlay(drawcallback, container, options)
      var pixiOverlay = L.pixiOverlay(function(utils) {
          // drawing callback function: drawcallback(utils, eventorcustomdata)
          // utils - helper object, contains methods to work with layers coordinate system and scaling
          var zoom = utils.getMap().getZoom(); // getmap return the current map
          container = utils.getContainer(); // return the pixi container used in the overlay
          renderer = utils.getRenderer(); // return the current pixi render
          var project = utils.latLngToLayerPoint; // return L.point projected from L.LatLng in the coordinate system of the overlay
          var scale = utils.getScale(); // return the current scale factor of the overlay or the scale factor associated to zoom value

          if (frame) {
            frame = null;
          }

          if (firstDraw) {}

          if (firstDraw && prevZoom !== zoom) {

            function Riders() {

              var numpart = data.length;
              //var numpart = 10;
              // particlecontainer class is a really fast version of the container built solely for speed
              // so use when you need a lot of sprites or particles
              var ridersParticles = new PIXI.particles.ParticleContainer(numpart);
              container.addChild(ridersParticles);

              var starterNum = 0;

              this.val = 1;
              this.loopLength = 5;

              var counterRepeat = 0;
              // d3 max compute the maximum value in an array
              var max = d3.max(data, function(d) {
                return d.length;
              });

              var ridersArr = [];
              var totalRiders = renderer instanceof PIXI.WebGLRenderer ? numpart : 1;
              var inArr = [];
              var stateArr = [];

              var wUnit = 17;
              var hUnit = 18;
              var indexStart = 1;
              var indexEnd = 24;

              for (var i = totalRiders; i--;) {
                // a texture stores the information that represents an image or part of an image
                var texture = new PIXI.Texture(resources.iris.texture);
                // rectangle object is an area defined by its position, the top-left corner point and its width and height
                // 从那个png图片中随机生成一个颜色的sprite
                var rect1 = new PIXI.Rectangle(wUnit * (parseInt(getRnd(indexEnd, indexStart))), 0, wUnit, hUnit);
                texture.frame = rect1;
                // the sprite object is the base for all textured objects that are rendered to the screen
                var rider = new PIXI.Sprite(texture);
                // the position of the rider
                var pos = [data[starterNum + i][0].lat, data[starterNum + i][0].lng];
                // the anchor sets the origin point of the texture
                rider.anchor.set(0.5);
                // the scale factor of the object
                rider.scale.set(1 * 0.028);
                rider.transform.position.set(project(pos).x, project(pos).y);

                //-----RIDRES ARRAYS
                ridersArr.push(rider);
                ridersParticles.addChild(rider);


                // data本身的数据结构可以研究下 topojson
                // 判断每个rider是否还可以移动,每一个元素对应每一个位置
                if (counterRepeat + 1 < data[starterNum + i].length) {
                  stateArr.push(true);
                } else {
                  stateArr.push(false);
                }

              }
              // 判断是否还需要更新
              this.onRepeat = function() {

                counterRepeat++;

                for (var i = totalRiders; i--;) {
                  if (counterRepeat + 1 < data[starterNum + i].length) {
                    stateArr[i] = true;

                  } else {
                    stateArr[i] = false;
                  }
                }
              };
              // 更新的操作，改变每个rider的位置
              this.updateHandler = function(value) {


                for (var i = totalRiders; i--;) {
                  // 如果还能更新
                  if (stateArr[i]) {

                    var pos = [data[starterNum + i][counterRepeat].lat,
                      data[starterNum + i][counterRepeat].lng
                    ];
                    ridersArr[i].transform.position.set(project(pos).x, project(pos).y);

                  }


                }
                // 更新渲染操作
                renderer.render(container);


              }
            } //---RIDERS

            // 生成一个实例
            var ridersGroup = new Riders();

            function drawCity() {

              var buffer = new PIXI.Graphics();
              container.addChild(buffer);

              drawPolyline(data);

              function drawPolyline(arr) {


                buffer.lineStyle(0.095, '0x000000', 0.3);
                buffer.beginFill(0xFFFF0B, 0.0);
                buffer.blendMode = PIXI.blendModes.SCREEN;


                var polys = [];
                for (var i = arr.length; i--;) {

                  var subPolys = [];

                  arr[i].forEach(function(coords, index) {
                    subPolys.push(project(coords).x);
                    subPolys.push(project(coords).y);
                  });

                  polys.push(subPolys);


                } //---end for

                for (var i = polys.length; i--;) {
                  buffer.drawPolygon(polys[i]);
                }

                $('.spinner').addClass('stop');

              } //---FINAL DRAW POLYLINE

            }
            drawCity();




            //---ANIMATION
            ticker.speed = 0.5;
            var oldDelta = 0;
            var newDelta = 0;


            ticker.add(function(deltaTime) {

              if (ridersGroup.val > ridersGroup.loopLength) {
                ridersGroup.val = 1;
              } else {
                ridersGroup.val += 1 * deltaTime;
              }

              oldDelta = newDelta;
              newDelta = parseInt(ridersGroup.val);

              if (oldDelta !== newDelta) {

                if (ridersGroup.val > ridersGroup.loopLength) {
                  ridersGroup.onRepeat();
                }
                ridersGroup.updateHandler(newDelta);

              }

            });
            ticker.stop();

          }



          if (!firstDraw && prevZoom !== zoom) {
            //console.log(zoom);
          }
          firstDraw = false;
          prevZoom = zoom;
          renderer.render(container);


        },
        pixiContainer);
      // add the overlay to the map
      pixiOverlay.addTo(leafletMap);


    }); //---LOADER

    function render() {
      renderer.render(container);
    }


    //---STOP BUTTON
    $('#stop-animation').on('click', function() {
      $(this).hide();
      $('#play-animation').show();
      ticker.stop();

    });

    $('#play-animation').on('click', function() {
      $(this).hide();
      $('#stop-animation').show();
      ticker.start();




    }); //----PIXI OVERLAY


  } //----PIXILAYER


  function getRnd(max, min) {
    return Math.random() * (max - min) + min;
  }
  // support topojson format
  function extendTopoJson() {
    L.TopoJSON = L.GeoJSON.extend({
      addData: function(jsonData) {
        if (jsonData.type === "Topology") {
          for (key in jsonData.objects) {
            // topojson is global variable in topojson.v1.min.js library
            geojson = topojson.feature(jsonData, jsonData.objects[key]);
            L.GeoJSON.prototype.addData.call(this, geojson);
          }
        } else {
          L.GeoJSON.prototype.addData.call(this, jsonData);
        }
      }
    });

  }


  function disableMapInteraction(map, idmap) {

    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    if (map.tap) map.tap.disable();
    document.getElementById(idmap).style.cursor = 'default';
  }

  function drawTilesMap(map) {
    var mapLayer = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}' + '' + '?access_token=pk.eyJ1IjoiY2Fyb2xpbmF2YWxsZWpvIiwiYSI6ImNqNGZuendsZDFmbmwycXA0eGFpejA5azUifQ._a5sIBQuS72Kw24eZgrEFw', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 15,
      id: 'mapbox.streets',
      accessToken: 'pk.eyJ1IjoiY2Fyb2xpbmF2YWxsZWpvIiwiYSI6ImNqNGZuendsZDFmbmwycXA0eGFpejA5azUifQ._a5sIBQuS72Kw24eZgrEFw'
    }).addTo(map);
  }

  function getRnd(max, min) {
    return Math.random() * (max - min) + min;
  }

  function hex(r, g, b) {
    return "0x" + ((1 << 24) + (parseInt(r) << 16) + (parseInt(g) << 8) + parseInt(b)).toString(16).slice(1);
  }

}(window.jQuery, window, document));


/*---------

geo2topo countries=bogota.geojson > bogota-map.json

var inter = d3.interpolateArray([x,y],[x,y])
var pos = inArr[i](deltaTime * 0.1, deltaTime * 0.1);

ridersArr[i].transform.position.set(project(pos).x, project(pos).y);


----------------*/