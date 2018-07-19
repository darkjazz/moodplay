import { Component, Input, OnInit, OnChanges, SimpleChange, ViewChild, ElementRef, Renderer } from "@angular/core";
import { MoodplayService } from '../services/moodplay.service';
import { ArtistCoords, TrackCoords } from '../shared/models';
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
  svg;
  width;
  height;
  color;
  label;

  constructor(private moodplayService: MoodplayService, public renderer: Renderer) { }

  ngOnInit(): void { }

  ngOnChanges(changes: {[propKey: string]: SimpleChange}): void {
    if (changes['selectionInput'].currentValue == 'artists')
      this.getArtists();
    if (changes['selectionInput'].currentValue == 'tracks')
      this.getTracks();
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

  initialiseArtists(): void {
    d3.select('svg').selectAll('*').remove();
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
        .attr("r", d => { return 5 })
        .attr("cursor", "pointer")
        .on("mouseover", d => this.showArtistInfo(d) )
        .on("mouseout", d => this.hideArtistInfo(d) )
      .transition()
        .ease(d3.easeCubicOut)
        .delay( d => { return Math.random() * 3000 }).duration(1000)
        .attr("cx", d => { return (d.valence + 1.0) * (this.width / 2) })
        .attr("cy", d => { return (d.arousal * -1.0 + 1.0) * (this.height / 2) }); // WHY??

    this.label = this.svg.selectAll(".label")
    	.data(this.artists)
    	.enter().append("text")
      .text( d => { return d.name } )
      .attr("x", d => { return (d.valence + 1.0) * (this.width / 2) })
      .attr("y", d => { return (d.arousal * -1.0 + 1.0) * (this.height / 2) })
      .style("text-anchor", "middle")
      .style("fill", "#444")
      .style("font-family", "Nunito")
      .style("font-size", "0pt")
      .style("pointer-events", "none")
      .attr("opacity", 0.0)
      .attr("cursor", "pointer")
  }

  initialiseTracks(): void {
    d3.select('svg').selectAll('*').remove();
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
      .attr("cursor", "pointer")
      .on("mouseover", d => this.showTrackInfo(d) )
      .on("mouseout", d => this.hideTrackInfo(d) )
    .transition()
      .ease(d3.easeCubicOut)
      .delay( d => { return Math.random() * 3000 }).duration(1000)
      .attr("cx", d => { return (d.valence + 1.0) * (this.width / 2) })
      .attr("cy", d => { return (d.arousal * -1.0 + 1.0) * (this.height / 2) })

      this.label = this.svg.selectAll(".label")
      	.data(this.tracks)
      	.enter().append("text")
        .text( d => { return d.title + ' (' + d.artist + ')' } )
        .attr("x", d => { return (d.valence + 1.0) * (this.width / 2) })
        .attr("y", d => { return (d.arousal * -1.0 + 1.0) * (this.height / 2) })
        .style("text-anchor", "middle")
        .style("fill", "#444")
        .style("font-family", "Nunito")
        .style("font-size", "0pt")
        .style("pointer-events", "none")
        .attr("opacity", 0.0)
        .attr("cursor", "pointer")
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
      return (node["title"] == selected.title)
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
}
