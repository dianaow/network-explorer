import * as d3 from 'd3';
import moment from 'moment';

export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

export function onlyUnique(value, index, self) {
  return self.indexOf(value) === index
}

export function getFormat(timeCol) {
  if(timeCol === 'minutes'){
    return 'HHmmss'
  } else if(timeCol === 'hours'){
    return "MMM DD hha"
  } else if(timeCol === 'days'){
    return "MMM DD"
  } else if(timeCol === 'months'){
    return "MMM YY"
  } else if(timeCol === 'years'){
    return "YY"
  }
}

export function getTicksGenerator(timeCol) {
  if(timeCol === 'minutes'){
    return d3.timeMinute
  } else if(timeCol === 'hours'){
    return d3.timeHour
  } else if(timeCol === 'days'){
    return d3.timeDay
  } else if(timeCol === 'months'){
    return d3.timeMonth
  } else if(timeCol === 'years'){
    return d3.timeYear
  }
}

export function getTime(time, timeInterval) {
  return moment(time).format(getFormat(timeInterval))
}

export function getRange(startDate, endDate, type) {
   
  let fromDate = moment(startDate)
  let toDate = moment(endDate)
  let diff = toDate.diff(fromDate, type)
  let range = []
  for (let i = 0; i < Math.abs(diff); i++) {
    range.push(moment(startDate).add(i, type)) // based on desired timezone, subtract the hours that are ahead of the UTC timezone.
  }
  return range.map(d=>getTime(d, type))
}

export function findDegree(links) {

  const linksTarget_nested = d3.nest()
    .key(function (d) {
      return d.target
    })
    .rollup(function (leaves) {
      return leaves.length
    })
    .entries(links)

  const linksSource_nested = d3.nest()
    .key(function (d) {
      return d.source
    })
    .rollup(function (leaves) {
      return leaves.length
    })
    .entries(links)

  const linksNested = []
  linksTarget_nested.forEach(function (d, i) {
    linksNested.push({ key: d.key, value: d.value })
  })
  linksSource_nested.forEach(function (d, i) {
    linksNested.push({ key: d.key, value: d.value })
  })

  const linkAllNodes = d3.nest()
    .key(function (d) {
      return d.key
    })
    .rollup(function (leaves) {
      return d3.sum(leaves, (d) => d.value)
    })
    .entries(linksNested)

  return linkAllNodes
}

export function filterDataFromForm(raw, filters){

  const { entity, dates, degree } = filters
  let timeInterval = filters.timeInterval
  
  let newData = []
  if(entity && entity !== 'All'){
    newData = filterByDevices([entity], raw, dates, timeInterval) // only render edges one hop away from searched node
    // use filtered results to find connections for the next hop step
    let nodeIds = []
    let n1s = newData.map(d=>d.source)
    let n1t = newData.map(d=>d.target)
    nodeIds.push(n1s)
    nodeIds.push(n1t)
    nodeIds.push(entity)
    if(degree > 1){
      newData = filterByDevices(nodeIds.flat(), raw, dates, timeInterval) // render edges 2 hop away from searched node
      //console.log(newData)
      let n2s = newData.map(d=>d.source)
      let n2t = newData.map(d=>d.target)
      nodeIds.push(n2s)
      nodeIds.push(n2t)
      if(degree > 2){
       newData = filterByDevices(nodeIds.flat(), raw, dates, timeInterval) // render edges 3 hop away from searched node
       //console.log(newData)          
      }
    }
  } else if(dates.length > 0){
    newData = filterByDate(dates, raw, timeInterval) // no concept of 'hops' if no node ID is searched for
  } else {
    newData = raw
  }
  
  return newData

}

function filterByDate(dates, data, timeInterval) {
  const tickFormat = getFormat(timeInterval)
  let datesArr = getRange(dates[0], dates[1], timeInterval)
  return data.filter(d => datesArr.indexOf(moment(d.epoch).format(tickFormat)) !== -1)
}

export function filterByDevices(devices, data, dates, timeInterval) {
  let newData = data.filter(d=>devices.indexOf(d.source) !== -1 | devices.indexOf(d.target) !== -1)
  if(dates && dates.length > 0){
    newData = filterByDate(dates, newData, timeInterval)
  }  
  return newData
}
