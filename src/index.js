import './styles.css';
import * as d3 from 'd3';

const dsUri =
  'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';
const padding = 80;
const width = 1024;
const height = 500;
const body = d3.select('body');
const wrapper = body.append('div').attr('class', 'wrapper');
const colors = [
  {
    tempRange: [-30, -3],
    color: '#553fff',
  },
  {
    tempRange: [-3, -2],
    color: '#6450ff',
  },
  {
    tempRange: [-2, -1],
    color: '#7361ff',
  },
  {
    tempRange: [-1, 1],
    color: '#f19a3e',
  },
  {
    tempRange: [1, 2],
    color: '#ff4b5d',
  },
  {
    tempRange: [2, 3],
    color: '#ff374b',
  },
  {
    tempRange: [3, 30],
    color: '#ff2339',
  },
];
const tooltip = wrapper
  .append('div')
  .attr('id', 'tooltip')
  .attr('class', 'tooltip');

wrapper
  .append('h1')
  .text('Global Temperature')
  .attr('id', 'title')
  .style('text-align', 'center');

function barFill(variance) {
  if (variance >= -1 && variance <= 1) {
    return colors[3].color;
  }
  return colors.find(i => {
    return variance > i.tempRange[0] && variance < i.tempRange[1];
  }).color;
}

function legend(svg) {
  const squareSize = 30;
  const colorScale = d3.scaleBand(
    ['<=-3', -2, -1, 0, 1, 2, '>= 3'],
    [0, squareSize * colors.length]
  );

  const colorAxis = d3.axisBottom(colorScale).tickValues(colorScale.domain());

  const group = svg
    .append('g')
    .attr('transform', `translate(${padding}, ${height})`)
    .attr('id', 'legend');
  group
    .append('g')
    .attr('id', 'color-axis')
    .attr('transform', `translate(0, ${squareSize})`)
    .call(colorAxis);
  group
    .selectAll('.legend-item')
    .data(colors)
    .enter()
    .append('rect')
    .attr('width', squareSize)
    .attr('height', squareSize)
    .attr('x', (d, i) => i * 30)
    .attr('fill', i => i.color)
    .attr('stroke', '#000000')
    .attr('class', 'legend-item');
}

d3.json(dsUri).then(response => {
  const baseTemp = response.baseTemperature;
  const minYear = d3.min(response.monthlyVariance, i => i.year);
  const maxYear = d3.max(response.monthlyVariance, i => i.year);
  wrapper
    .append('h2')
    .text(`Temperature variance between the years ${minYear}-${maxYear}`)
    .attr('id', 'description')
    .style('text-align', 'center');
  const svg = wrapper
    .append('svg')
    .attr('width', width + padding)
    .attr('height', height + padding)
    .style('margin', '0 auto')
    .style('display', 'block');

  const data = response.monthlyVariance.map(i => {
    return {
      variance: i.variance,
      month: i.month - 1,
      year: i.year,
    };
  });

  const yearScale = d3.scaleBand(data.map(i => i.year), [0, width - padding]);

  const monthScale = d3.scaleBand(
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    [padding, height - padding]
  );

  const yearAxis = d3
    .axisBottom(yearScale)
    .tickFormat(i => d3.timeFormat('%Y')(new Date(i, 1)))
    .tickValues(yearScale.domain().filter(i => i % 10 === 0))
    .tickSize(10, 1);

  const monthAxis = d3
    .axisLeft(monthScale)
    .tickValues(monthScale.domain())
    .tickFormat(i => {
      return d3.timeFormat('%B')(new Date(1970, i));
    })
    .tickSize(8)
    .tickPadding(4);

  svg
    .append('g')
    .attr('id', 'x-axis')
    .attr('transform', `translate(${padding}, ${height - padding})`)
    .call(yearAxis);

  svg
    .append('g')
    .attr('id', 'y-axis')
    .attr('transform', `translate(${padding}, 0)`)
    .call(monthAxis);

  svg
    .selectAll('.cell')
    .data(data)
    .enter()
    .append('rect')
    .attr('width', d => yearScale.bandwidth())
    .attr('height', d => monthScale.bandwidth())
    .attr('x', d => padding + yearScale(d.year))
    .attr('y', d => monthScale(d.month))
    .attr('fill', d => barFill(d.variance))
    .attr('class', 'cell')
    .attr('data-month', d => d.month)
    .attr('data-year', d => d.year)
    .attr('data-temp', d => d.variance)
    .on('mouseover', d => {
      const target = d3.select(d3.event.target);
      target.attr('stroke', 'black');
      tooltip
        .style('opacity', 0.9)
        .html(
          `
          Year: ${d.year}<br />
          Temperature: ${d3.format('.2')(baseTemp + d.variance)}<br />
          Variance: ${d3.format('.2')(d.variance)}&deg;C
        `
        )
        .style('left', `${d3.event.pageX}px`)
        .style('top', `${d3.event.pageY + 28}px`)
        .attr('data-year', d.year);
    })
    .on('mouseout', d => {
      const target = d3.select(d3.event.target);
      target.attr('stroke', '');
      tooltip.style('opacity', 0);
    });

  legend(svg);
});
