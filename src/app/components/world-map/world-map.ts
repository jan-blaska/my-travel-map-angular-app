import {
  Component,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  input,
  output,
  effect,
  inject,
} from '@angular/core';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { COUNTRY_NAME_BY_ID } from '../../data/countries';

const MAP_WIDTH = 960;
const MAP_HEIGHT = 500;
const COLOR_VISITED = '#22c55e';
const COLOR_UNVISITED = '#cbd5e1';
const COLOR_HOVER_VISITED = '#16a34a';
const COLOR_HOVER_UNVISITED = '#94a3b8';
const COLOR_OCEAN = '#bfdbfe';
const COLOR_GRATICULE = '#93c5fd';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFeature = any;

@Component({
  selector: 'app-world-map',
  templateUrl: './world-map.html',
  styleUrl: './world-map.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldMapComponent implements AfterViewInit, OnDestroy {
  visitedCountryIds = input<Set<string>>(new Set());
  countryToggled = output<string>();

  @ViewChild('mapSvg') private svgRef!: ElementRef<SVGSVGElement>;
  @ViewChild('tooltip') private tooltipRef!: ElementRef<HTMLDivElement>;

  private zone = inject(NgZone);
  private countryPaths?: d3.Selection<SVGPathElement, AnyFeature, SVGGElement, unknown>;

  constructor() {
    effect(() => {
      const ids = this.visitedCountryIds();
      this.updateColors(ids);
    });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => this.loadAndRender());
  }

  ngOnDestroy(): void {
    d3.select(this.svgRef?.nativeElement).on('.zoom', null);
  }

  private async loadAndRender(): Promise<void> {
    const topology = await d3.json<Topology>('/countries-110m.json');
    if (!topology) return;
    this.render(topology);
  }

  private render(topology: Topology): void {
    const svg = d3.select(this.svgRef.nativeElement);
    const tooltip = d3.select(this.tooltipRef.nativeElement);
    const ids = this.visitedCountryIds();

    svg.selectAll('*').remove();
    const g = svg.append('g');

    const projection = d3.geoNaturalEarth1()
      .scale(160)
      .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

    const path = d3.geoPath().projection(projection);

    // Ocean sphere
    g.append('path')
      .datum({ type: 'Sphere' } as d3.GeoSphere)
      .attr('d', path as unknown as string)
      .attr('fill', COLOR_OCEAN);

    // Graticule grid lines
    const graticule = d3.geoGraticule();
    g.append('path')
      .datum(graticule())
      .attr('d', path as unknown as string)
      .attr('fill', 'none')
      .attr('stroke', COLOR_GRATICULE)
      .attr('stroke-width', 0.3);

    // Countries
    const countries = feature(
      topology,
      topology.objects['countries'] as GeometryCollection
    );

    this.countryPaths = g
      .selectAll<SVGPathElement, AnyFeature>('path.country')
      .data(countries.features as AnyFeature[])
      .join('path')
      .attr('class', 'country')
      .attr('d', (d: AnyFeature) => path(d) ?? '')
      .attr('fill', (d: AnyFeature) => (ids.has(String(d.id)) ? COLOR_VISITED : COLOR_UNVISITED))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.5)
      .attr('stroke-linejoin', 'round')
      .style('cursor', 'pointer')
      .on('mousemove', (event: MouseEvent, d: AnyFeature) => {
        const name = COUNTRY_NAME_BY_ID.get(String(d.id));
        if (!name) return;
        tooltip
          .style('display', 'block')
          .style('left', `${event.clientX + 14}px`)
          .style('top', `${event.clientY - 38}px`)
          .text(name);
      })
      .on('mouseover', (event: MouseEvent, d: AnyFeature) => {
        const visited = this.visitedCountryIds().has(String(d.id));
        d3.select(event.currentTarget as SVGPathElement)
          .attr('fill', visited ? COLOR_HOVER_VISITED : COLOR_HOVER_UNVISITED);
      })
      .on('mouseout', (event: MouseEvent, d: AnyFeature) => {
        const visited = this.visitedCountryIds().has(String(d.id));
        d3.select(event.currentTarget as SVGPathElement)
          .attr('fill', visited ? COLOR_VISITED : COLOR_UNVISITED);
        tooltip.style('display', 'none');
      })
      .on('click', (_event: MouseEvent, d: AnyFeature) => {
        this.zone.run(() => this.countryToggled.emit(String(d.id)));
      });

    // Zoom & pan
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
        tooltip.style('display', 'none');
      });

    svg.call(zoom);
  }

  private updateColors(ids: Set<string>): void {
    this.countryPaths?.attr('fill', (d: AnyFeature) =>
      ids.has(String(d.id)) ? COLOR_VISITED : COLOR_UNVISITED
    );
  }
}
