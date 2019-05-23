import { Component, Input, OnInit, OnChanges, SimpleChange, ViewChild, ElementRef, Renderer } from "@angular/core";
import { filter } from 'rxjs/operators';
import { MoodplayService } from '../services/moodplay.service';
import { PlayerService } from '../services/player.service';
import { Coords, Mood, User, Party } from '../shared/models';
import * as d3 from "d3";

const TIME_LIMIT = 11000;
const COORDS_HISTORY_SIZE = 23;
const TDUR = 10000;
const N_CIRCLES = 5;
const BRIGHT = 0.7;
const DARK = 1.0 ;
const FRAG_SIZE = 1201;

const pi_rng = 2 * Math.PI;
const pi_rng_inv = 1 / pi_rng;

const emoji = [
  { name: "angry", valence: -1.0, arousal: 1.0 },
  { name: "party", valence: 0.91, arousal: 1.0 },
  { name: "sad", valence: -1.0, arousal: -0.84 },
  { name: "smile", valence: 0.91, arousal: -0.84 }
]

@Component({
  moduleId: module.id,
  selector: 'graphics',
  templateUrl: 'graphics.component.html',
  styleUrls: ['graphics.component.css']
})
export class GraphicsComponent implements OnInit, OnChanges {
  @ViewChild('graph') private element: ElementRef;
  @Input() coords: Coords;
  @Input() party: Party;
  @Input() user: User;
  moods: Mood[];
  trackCoords: Coords[];
  cursorCoords: Coords;

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
  ioPartyMessage;
  ioTrackCoordinates;
  ioCursorMessage;
  playerCursor;

  constructor(
    private moodplayService: MoodplayService,
    private playerService: PlayerService,
    public renderer: Renderer) { }

  ngOnInit(): void {
    this.trackCoords = new Array();
    this.makeInterface();
  }

  ngOnChanges(changes: {[propKey: string]: SimpleChange}): void {
    if (changes['coords'] && this.coords )
      this.displayPlayerCursor();
    if (changes['party'] && this.party )
      this.displayPartyUsers();
  }

  makeInterface(): void {
    this.moodplayService.getMoods()
      .then(moods => {
        this.moods = moods;
        this.initialisePlay();
      })
  }

  initialisePlay(): void {
    this.svg = d3.select(this.element.nativeElement);

    this.width = +this.svg.attr("width");
    this.height = +this.svg.attr("height");

    this.color = d3.scaleSequential(d3.interpolateRainbow).domain([1 * Math.PI, -1 * Math.PI]);

    var fragments = [];

    Array.from({length: FRAG_SIZE}, () => {
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
        .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; })
        // .call(this.redrawPolygon);

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
        .attr("stroke", d => {
          var coords = this.moods[this.points.indexOf(d.data)];
          d.angle = Math.atan2(coords.arousal, coords.valence);
          d.distance = Math.hypot(coords.valence, coords.arousal);
          return this.color(d.angle)
        })
        .attr("opacity", 0)
        .attr("cursor", "pointer")
        .on("click", d => this.showLocation(d))
        .attr("d", function(d) { return d ? "M" + d.join("L") + "Z" : null; });

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
      .style("border-radius", "13px")
      .style("padding", "5px")
      .style("text-transform", "capitalize")
      .style("opacity", 0.8);

    this.svg.selectAll("image")
      .data(emoji)
      .enter()
      .append("image")
      .attr("x", d => {
        var point = this.fromMoodToPoint(d.valence, d.arousal);
        return point.left;
      })
      .attr("y", d => {
        var point = this.fromMoodToPoint(d.valence, d.arousal);
        return point.top;
      })
      .attr("width", 48)
      .attr("height", 48)
      .style("opacity", 0.7)
      .attr("z-index", -10)
      .attr("xlink:href", d => {
        return "./assets/" + d.name + ".png";
      })

    var cursorColors = Array.from({length: N_CIRCLES}, (e, i) => {
      return {
        x: this.width / 2,
        y: this.height / 2,
        color: 2 * Math.PI / N_CIRCLES * i,
        radius: 2.0 * i,
        opacity: 1.0 - (0.5 / N_CIRCLES * i)
      }
    });

    this.playerCursor = this.svg.selectAll("circle")
      .data(cursorColors)
      .enter()
      .append("circle")
      .style("stroke-width", 5.0)
      .style("stroke-opacity", d => d.opacity)
      .style("fill-opacity", d => (1.0 - d.opacity))
      .style("stroke", d => { return d3.rgb(this.color(d.color)).brighter(BRIGHT) })
      .attr("r", d => (d.radius * 4))
      .call(this.redrawCursor);

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

  redrawCursor(cursor) {
    cursor
      .attr("cx", d => { return d.x })
      .attr("cy", d => { return d.y })
  }

  showLocation(polygon) {
    var mood = this.moods[this.points.indexOf(polygon.data)];
    var left = ((<any>event).pageX-15)+"px";
    var top = ((<any>event).pageY-20)+"px";
    var labelColor = this.color(polygon.angle);
    this.label.selectAll("*").interrupt();
    this.label
      .style("visibility", "visible")
      .style("opacity", 0.9)
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
    this.label.transition().duration(100).ease(d3.easeLinear).style("opacity", 0.9)
  }

  mouseOut(elem) {
    this.label.transition().duration(400).ease(d3.easeLinear).style("opacity", 0.0)
  }

  selectMood(elem) {
    var svgcoords = d3.mouse(this.svg.node());
    var valence = svgcoords[0] / (this.width / 2.0) - 1.0;
    var arousal = (svgcoords[1] / (this.height / 2.0) - 1.0) * -1.0;
    // var coords = { valence: valence, arousal: arousal };
    this.selectedLabel
      .style("visibility", "visible")
      .style("opacity", 0.9)
      .style("top", this.currentCoords.top)
      .style("left", this.currentCoords.left)
      .style("background-color", "#333")
      .style("color", this.currentCoords.color)
      .text(this.user.name);
    this.label.style("visibility", "hidden");
    // this.selectedLabel.transition().duration(TDUR).ease(Math.sqrt)
    //   .style("opacity", 1e-6);
    this.moodplayService.sendUserCoordinates(this.user.id, valence, arousal);
  }

  displayPartyUsers() {
    if (this.party) {
      var users = (<any>Object).values(this.party.users).filter(user => {
        return user.id != this.user.id && Date.now() - user.current_coords.date < this.party.vote_length
      });
      if (this.others) { this.others.remove() }
      if (Date.now() - this.party.users[this.user.id].current_coords.date > this.party.vote_length)
        this.selectedLabel.style("visibility", "hidden");
      this.others = this.svg.selectAll(".label")
			   .data(users)
			   .enter().append("text")
	       .text( u => {
           u.point = this.fromMoodToPoint(u.current_coords.valence, u.current_coords.arousal);
           var angle = Math.atan2(u.current_coords.arousal, u.current_coords.valence);
           u.color = this.color( angle + Math.PI );
           return u.name
         })
         .style("position", "absolute")
         .style("z-index", "9")
         .style("font-family", "Nunito")
         .style("font-size", "17pt")
         .style("text-anchor", "middle")
         .attr("border", "2pt solid #333")
         .attr("border-radius", "17px")
         .style("padding", "7px")
         .style("text-transform", "capitalize")
         .style("opacity", 1.0)
         .attr("y", u => u.point.top )
         .attr("x", u => u.point.left )
         .attr("fill", u => u.color )
         .attr("stroke", "#000")
         .attr("stroke-opacity", 1.0)
    }
  }

  displayPlayerCursor() {
    var point = this.fromMoodToPoint(this.coords.valence, this.coords.arousal);
    this.playerCursor.selectAll("*").interrupt();
    this.playerCursor.transition().duration(this.party.update_rate * 1.1).ease(d3.easeLinear)
      .attr("cx", point.left)
      .attr("cy", point.top);
  }

  wrapColor(color) {
    return color - pi_rng * Math.floor(color * pi_rng_inv)
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

}
