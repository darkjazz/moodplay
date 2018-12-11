import { Component, Input, OnInit, OnChanges, SimpleChange, ViewChild, ElementRef, Renderer } from "@angular/core";
import { MoodplayService } from '../services/moodplay.service';
import { PlayerService } from '../services/player.service';
import { ArtistCoords, TrackCoords, Mood, User, Party } from '../shared/models';
import * as d3 from "d3";

@Component({
  moduleId: module.id,
  selector: 'graphics',
  templateUrl: 'graphics.component.html',
  styleUrls: ['graphics.component.css']
})
export class GraphicsComponent implements OnInit, OnChanges {
  @ViewChild('graph') private element: ElementRef;
  @Input() selectionInput: string;
  artists: ArtistCoords[];
  tracks: TrackCoords[];
  moods: Mood[];
  user: User;
  party: Party;

  svg;
  width;
  height;
  color;
  strokeColor;
  label;
  points;
  moodColor;
  moodTop;
  moodLeft;
  currentCoords;
  selectedLabel;
  timeout;
  fragments;
  others;
  ioConnection;

  constructor(
    private moodplayService: MoodplayService,
    private playerService: PlayerService,
    public renderer: Renderer) { }

  ngOnInit(): void {
    this.initIoConnection();
  }

  ngOnChanges(changes: {[propKey: string]: SimpleChange}): void {
    d3.select('svg').selectAll('*').remove();
    //d3.select('div').selectAll('*').remove();
    if (changes['selectionInput'].currentValue == 'play')
      this.enterPlay();
    if (changes['selectionInput'].currentValue == 'artists')
      this.getArtists();
    if (changes['selectionInput'].currentValue == 'tracks')
      this.getTracks();
    if (changes['selectionInput'].currentValue == 'moods')
      this.getMoods();
  }

  initIoConnection() {
    this.moodplayService.initSocket();

    this.ioConnection = this.moodplayService.onPartyMessage()
      .subscribe((party: Party) => {
        this.party = party;
        this.displayPartyUsers();
      });
  }

  enterPlay(): void {
    this.moodplayService.addUser()
      .then(user => {
        this.user = user;
        console.log(user);
        this.moodplayService.getMoods()
          .then(moods => {
            this.moods = moods;
            this.initialisePlay();
          })
      })
  }

  getArtists(): void {
    this.moodplayService.getArtistCoordinates()
      .then(coords => {
        this.artists = coords;
        this.initialiseArtists();
      });
  }

  getTracks(): void {
    this.moodplayService.getTrackCoordinates()
      .then(coords => {
        this.tracks = coords;
        this.initialiseTracks();
      })
  }

  getMoods(): void {
    this.moodplayService.getMoods()
      .then(moods => {
        this.moods = moods;
        this.initialiseMoods();
      })
  }

  initialisePlay(): void {
    this.svg = d3.select(this.element.nativeElement);

    this.width = +this.svg.attr("width");
    this.height = +this.svg.attr("height");

    this.color = d3.scaleSequential(d3.interpolateRainbow).domain([1 * Math.PI, -1 * Math.PI]);

    var fragments = [];

    Array.from({length: 1200}, () => {
       fragments.push({ valence: (Math.random()-0.5)*2.0, arousal: (Math.random()-0.5)*2.0 } )
    });

    var b_points = fragments.map( m => { var point = [
        (m.valence + 1.0) * (this.width / 2),
        (m.arousal * -1.0 + 1.0) * (this.height / 2)
      ];
      return point;
    });

    var b_voronoi = d3.voronoi(b_points)
      .extent([[-1, -1], [this.width + 1, this.height + 1]]);

    var background_polygon = this.svg.append("g")
      .selectAll("path")
      .data(b_voronoi.polygons(b_points))
      .enter().append("path")
        .attr("fill", d => {
          var coords = fragments[b_points.indexOf(d.data)];
          d.angle = Math.atan2(coords.arousal, coords.valence);
          return this.color(d.angle)
        })
        .attr("stroke", d => {
          var coords = fragments[b_points.indexOf(d.data)];
          d.angle = Math.atan2(coords.arousal, coords.valence);
          var color = d3.rgb(this.color(d.angle)).brighter(0.2);
          return color;
        })
        .attr("opacity", d => {
          var coords = fragments[b_points.indexOf(d.data)];
          d.distance = Math.hypot(coords.valence, coords.arousal);
          return d.distance
        })
        .call(this.redrawPolygon);

    this.points = this.moods.map( m => { var point = [
        (m.valence + 1.0) * (this.width / 2),
        (m.arousal * -1.0 + 1.0) * (this.height / 2)
      ];
      return point;
    });

    var voronoi = d3.voronoi(this.points)
      .extent([[-1, -1], [this.width + 1, this.height + 1]]);

    var polygon = this.svg.append("g")
      .selectAll("path")
      .data(voronoi.polygons(this.points))
      .enter().append("path")
        // .attr("fill", d => {
        //   var coords = this.fragments[this.points.indexOf(d.data)];
        //   d.angle = Math.atan2(coords.arousal, coords.valence);
        //   return this.color(d.angle)
        // })
        .attr("stroke", d => {
          var coords = this.moods[this.points.indexOf(d.data)];
          d.angle = Math.atan2(coords.arousal, coords.valence);
          d.distance = Math.hypot(coords.valence, coords.arousal);
          return this.color(d.angle)
        })
        .attr("opacity", 0)
        .attr("cursor", "pointer")
        // .on("mouseover", d => {
        //   this.svg.selectAll("path").filter(node => {
        //     return (node == d)
        //   }).transition().duration(200)
        //   .attr("opacity", 0.73)
        // })
        // .on("mouseout", d => {
        //   this.svg.selectAll("path").filter(node => {
        //     return (node == d)
        //   }).transition().duration(200)
        //   .attr("opacity", 0.47)
        // })
        .on("click", d => this.showLocation(d))
        .call(this.redrawPolygon);

    // var link = this.svg.append("g")
    //   .selectAll("line")
    //   .data(voronoi.links(this.points))
    //   .enter().append("line")
    //   .attr("stroke", "#ddd")
    //   .attr("stroke-opacity", 0.8)
    //   .call(this.redrawLink);
    //
    // var site = this.svg.append("g")
    //   .selectAll("circle")
    //   .data(this.points)
    //   .enter().append("circle")
    //   .attr("r", 5.5)
    //   .attr("stroke", "#ddd")
    //   .attr("stroke-opacity", 0.8)
    //   .call(this.redrawSite);

    this.label = d3.select("body").append("div")
      .style("position", "absolute")
    	.style("z-index", "10")
    	.style("visibility", "hidden")
      .style("font-family", "Syncopate")
      .style("font-size", "14pt")
      .style("border", "2pt solid #aaa")
      .style("border-radius", "17px")
      .style("padding", "10px")
      .style("text-transform", "capitalize")
      .style("opacity", 0.4)
      .on("mouseover", elem => { this.mouseOver(elem) })
      .on("mouseout", elem => { this.mouseOut(elem) })
      .on("click", elem => { this.selectMood(elem) });

    this.selectedLabel = d3.select("body").append("div")
      .style("position", "absolute")
    	.style("z-index", "9")
    	.style("visibility", "hidden")
      .style("font-family", "Syncopate")
      .style("font-size", "14pt")
      .style("border", "2pt solid #333")
      .style("border-radius", "17px")
      .style("padding", "10px")
      .style("text-transform", "capitalize")
      .style("opacity", 0.8)

  }

  redrawPolygon(polygon) {
    polygon
      .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; });
  }

  redrawLink(link) {
    link
      .attr("x1", function(d) { return d.source[0]; })
      .attr("y1", function(d) { return d.source[1]; })
      .attr("x2", function(d) { return d.target[0]; })
      .attr("y2", function(d) { return d.target[1]; });
  }

  redrawSite(site) {
    site
      .attr("cx", function(d) { return d[0]; })
      .attr("cy", function(d) { return d[1]; });
  }

  showLocation(polygon) {
    var mood = this.moods[this.points.indexOf(polygon.data)];
    var left = ((<any>event).pageX-30)+"px";
    var top = ((<any>event).pageY-40)+"px";
    var labelColor = this.color(polygon.angle);
    this.label
      .style("visibility", "visible")
      .style("left", left)
      .style("top", top)
      .style("background-color", "#333")
      .style("color", labelColor)
      .style("cursor", "pointer")
      .text(mood.label);
    this.currentCoords = {
      mood: mood,
      left: left,
      top: top,
      color: labelColor
    }
  }

  mouseOver(elem) {
    this.label.style("opacity", 0.9)
  }

  mouseOut(elem) {
    this.label.style("opacity", 0.3)
  }

  selectMood(elem) {
    var svgcoords = d3.mouse(this.svg.node());
    var valence = svgcoords[0] / (this.width / 2.0) - 1.0;
    var arousal = (svgcoords[1] / (this.height / 2.0) - 1.0) * -1.0;
    // var coords = { valence: valence, arousal: arousal };
    this.selectedLabel
      .style("visibility", "visible")
      .style("top", this.currentCoords.top)
      .style("left", this.currentCoords.left)
      .style("background-color", "#333")
      .style("color", this.currentCoords.color)
      .text(this.user.name);
    this.label.style("visibility", "hidden");
    this.moodplayService.sendUserCoordinates(this.user.id, valence, arousal);
  }

  displayPartyUsers() {
    if (this.party) {
      var users = (<any>Object).values(this.party.users).filter(user => { return user.id != this.user.id });
      if (this.others) { this.others.remove() }
      this.others = this.svg.selectAll(".label")
			   .data(users)
			   .enter().append("text")
	       .text( u => {
           u.point = this.fromMoodToPoint(u.current_coords.valence, u.current_coords.arousal);
           var angle = Math.atan2(u.current_coords.arousal, u.current_coords.valence);
           console.log(angle);
           u.color = this.color( angle + Math.PI );
           return u.name
         })
         .style("position", "absolute")
         .style("z-index", "9")
         .style("font-family", "Nunito")
         .style("font-size", "17pt")
         .attr("border", "2pt solid #333")
         .attr("border-radius", "17px")
         .style("padding", "7px")
         .style("text-transform", "capitalize")
         .style("opacity", 0.8)
         .attr("y", u => u.point.top )
         .attr("x", u => u.point.left )
         .attr("fill", u => u.color )
         .attr("stroke", "#000")
         .attr("stroke-opacity", 1.0)

    }
  }

  fromMoodToPoint(valence, arousal) {
    var point = { left: 0, top: 0 };
    point.left = (valence + 1.0) * (this.width / 2);
    point.top = (arousal * -1.0 + 1.0) * (this.height / 2);
    return point;
  }

  fromPointToMood(x, y) {
    var mood = { valence: 0, arousal: 0 };
    mood.valence = x / (this.width / 2.0) - 1.0;
    mood.arousal = (y / (this.height / 2.0) - 1.0) * -1.0;
    return mood;
  }

  initialiseArtists(): void {
    this.svg = d3.select(this.element.nativeElement);

    this.width = +this.svg.attr("width");
    this.height = +this.svg.attr("height");

    this.color = d3.scaleSequential(d3.interpolateRainbow).domain([1 * Math.PI, -1 * Math.PI]);

    this.svg.append("g").selectAll("circle").data(this.artists)
      .enter()
      .append("circle")
        .attr("fill", d => { return this.color(d.angle = Math.atan2(d.arousal, d.valence)) })
        .attr("cx", d => { return Math.cos(d.angle) * (this.width / Math.SQRT2 + 30) + 480 })
        .attr("cy", d => { return Math.sin(d.angle) * (this.height / Math.SQRT2 + 30) + 480 })
        .attr("r", d => { return 4 })
        .attr("opacity", 0.8)
        .attr("cursor", "pointer")
        .on("mouseover", d => this.showArtistInfo(d) )
        .on("mouseout", d => this.hideArtistInfo(d) )
        .on("click", d => this.playerService.transitionToArtist(d))
      .transition()
        .ease(d3.easeCubicOut)
        .delay( d => { return Math.random() * 3000 }).duration(2000)
        .attr("cx", d => { return (d.valence + 1.0) * (this.width * 0.8 / 2) + 30 })
        .attr("cy", d => { return (d.arousal * -1.0 + 1.0) * (this.height * 0.8 / 2) + 30 }); // WHY??

    this.label = this.svg.selectAll(".label")
    	.data(this.artists)
    	.enter().append("text")
      .text( d => { return d.name } )
      .attr("x", d => { return (d.valence + 1.0) * (this.width * 0.8 / 2) + 30 })
      .attr("y", d => { return (d.arousal * -1.0 + 1.0) * (this.height * 0.8 / 2) + 30 })
      .style("text-anchor", "middle")
      .style("fill", "#444")
      .style("font-family", "Nunito")
      .style("font-size", "0pt")
      .style("pointer-events", "none")
      .attr("opacity", 0.0)
      .attr("cursor", "pointer")
  }

  initialiseTracks(): void {
    this.svg = d3.select(this.element.nativeElement);

    this.width = +this.svg.attr("width");
    this.height = +this.svg.attr("height");

    this.color = d3.scaleSequential(d3.interpolateRainbow).domain([1 * Math.PI, -1 * Math.PI]);

    this.svg.append("g").selectAll("circle").data(this.tracks)
    .enter()
    .append("circle")
      .attr("fill", d => { return this.color(d.angle = Math.atan2(d.arousal, d.valence)) })
      .attr("cx", d => { return Math.cos(d.angle) * (this.width / Math.SQRT2 + 30) + 480 })
      .attr("cy", d => { return Math.sin(d.angle) * (this.height / Math.SQRT2 + 30) + 480 })
      .attr("r", d => { return 3 })
      .attr("opacity", 0.8)
      .attr("cursor", "pointer")
      .on("mouseover", d => this.showTrackInfo(d) )
      .on("mouseout", d => this.hideTrackInfo(d) )
      .on("click", d => this.playerService.transitionToTrack(d))
    .transition()
      .ease(d3.easeCubicOut)
      .delay( d => { return Math.random() * 3000 }).duration(2000)
      .attr("cx", d => { return (d.valence + 1.0) * (this.width * 0.8 / 2) + 30 })
      .attr("cy", d => { return (d.arousal * -1.0 + 1.0) * (this.height * 0.8 / 2) + 30 })

      this.label = this.svg.selectAll(".label")
      	.data(this.tracks)
      	.enter().append("text")
        .text( d => { return d.title + ' (' + d.artist + ')' } )
        .attr("x", d => { return (d.valence + 1.0) * (this.width * 0.8 / 2) + 30 })
        .attr("y", d => { return (d.arousal * -1.0 + 1.0) * (this.height * 0.8 / 2) + 30 })
        .style("text-anchor", "middle")
        .style("fill", "#444")
        .style("font-family", "Nunito")
        .style("font-size", "0pt")
        .style("pointer-events", "none")
        .attr("opacity", 0.0)
        .attr("cursor", "pointer")
  }

  initialiseMoods(): void {
    this.svg = d3.select(this.element.nativeElement);

    this.width = +this.svg.attr("width");
    this.height = +this.svg.attr("height");

    this.color = d3.scaleSequential(d3.interpolateRainbow).domain([1 * Math.PI, -1 * Math.PI]);

    this.svg.append("g").selectAll("circle").data(this.moods)
    .enter()
    .append("circle")
      .attr("fill", d => { return this.color(d.angle = Math.atan2(d.arousal, d.valence)) })
      .attr("cx", d => { return Math.cos(d.angle) * (this.width / Math.SQRT2 + 30) + 480 })
      .attr("cy", d => { return Math.sin(d.angle) * (this.height / Math.SQRT2 + 30) + 480 })
      .attr("r", d => { return 40 })
      .attr("opacity", 0.4)
      .attr("cursor", "pointer")
      .on("mouseover", d => this.showMoodInfo(d) )
      .on("mouseout", d => this.hideMoodInfo(d) )
      .on("click", d => this.playerService.transitionToMood(d))
    .transition()
      .ease(d3.easeCubicOut)
      .delay( d => { return Math.random() * 3000 }).duration(2000)
      .attr("cx", d => { return (d.valence + 1.0) * (this.width * 0.8 / 2) + 30 })
      .attr("cy", d => { return (d.arousal * -1.0 + 1.0) * (this.height * 0.8 / 2) + 30 })

      this.label = this.svg.selectAll(".label")
      	.data(this.moods)
      	.enter().append("text")
        .text( d => { return d.label } )
        .attr("fill", d => { return this.color(d.angle = Math.atan2(d.arousal, d.valence)) })
        .attr("x", d => { return (d.valence + 1.0) * (this.width * 0.8 / 2) + 30 })
        .attr("y", d => { return (d.arousal * -1.0 + 1.0) * (this.height * 0.8 / 2) + 30 })
        .style("text-anchor", "middle")
        .style("font-family", "Nunito")
        .style("font-size", "10pt")
        .style("pointer-events", "none")
        .attr("opacity", 0.0)
        .attr("cursor", "pointer")
        .transition()
          .ease(d3.easeCubicOut)
          .delay(3000).duration(1000)
          .attr("opacity", 0.7)
  }

  showArtistInfo(selected) {
    this.svg.selectAll("text").filter(node => {
      return (node["name"] == selected.name)
    }).transition().duration(200)
      .style("font-size", "7pt")
      .style("fill", "#ddd")
      .style("-webkit-text-stroke-width", "0px")
      .style("-webkit-text-stroke-color", "#000")
      .attr("opacity", 0.9);
  }

  hideArtistInfo(selected) {
    this.svg.selectAll("text").filter(node => {
      return (node["name"] == selected.name)
    }).transition().duration(200)
      .style("font-size", "0pt")
      .style("fill", "#444")
      .style("-webkit-text-stroke-width", "0px")
      .style("-webkit-text-stroke-color", "#000")
      .attr("opacity", 0.0);
  }

  showTrackInfo(selected) {
    this.svg.selectAll("text").filter(node => {
      return (node["title"] == selected.title && node["artist"] == selected["artist"])
    }).transition().duration(200)
      .style("font-size", "7pt")
      .style("fill", "#ddd")
      .style("-webkit-text-stroke-width", "0px")
      .style("-webkit-text-stroke-color", "#000")
      .attr("opacity", 0.9);
  }

  hideTrackInfo(selected) {
    this.svg.selectAll("text").filter(node => {
      return (node["title"] == selected.title)
    }).transition().duration(200)
      .style("font-size", "0pt")
      .style("fill", "#444")
      .style("-webkit-text-stroke-width", "0px")
      .style("-webkit-text-stroke-color", "#000")
      .attr("opacity", 0.0);
  }

  showMoodInfo(selected) {
    this.svg.selectAll("text").filter(node => {
      return (node["label"] == selected.label)
    }).transition().duration(200)
      .style("font-size", "16pt")
      .style("-webkit-text-stroke-width", "0px")
      .style("-webkit-text-stroke-color", "#000")
      .attr("opacity", 0.9);
  }

  hideMoodInfo(selected) {
    this.svg.selectAll("text").filter(node => {
      return (node["label"] == selected.label)
    }).transition().duration(200)
      .style("font-size", "10pt")
      .style("-webkit-text-stroke-width", "0px")
      .style("-webkit-text-stroke-color", "#000")
      .attr("opacity", 0.7);
  }
}
