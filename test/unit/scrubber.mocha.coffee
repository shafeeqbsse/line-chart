describe 'scrubber tooltip', ->
  element = undefined
  innerScope = undefined
  outerScope = undefined

  fakeMouse = undefined

  flushD3 = undefined

  beforeEach module 'n3-line-chart'
  beforeEach module 'testUtils'

  beforeEach inject (n3utils, _fakeMouse_) ->
    flushD3 = ->
      now = Date.now
      Date.now = -> Infinity
      d3.timer.flush()
      Date.now = now

    fakeMouse = _fakeMouse_

    sinon.stub n3utils, 'getDefaultMargins', ->
      top: 20
      right: 50
      bottom: 30
      left: 50

    sinon.stub n3utils, 'getTextBBox', -> {width: 30}


  beforeEach inject (pepito) ->
    {element, innerScope, outerScope} = pepito.directive """
    <div>
      <linechart data='data' options='options'></linechart>
    </div>
    """

  beforeEach ->
    outerScope.$apply ->
      outerScope.data = [
        {x: 0, value: 4}
        {x: 1, value: 8}
        {x: 2, value: 15}
        {x: 3, value: 16}
        {x: 4, value: 23}
        {x: 5, value: 42}
      ]
      outerScope.options =
        axes: {x: {tooltipFormatter: (v) -> '$' + v}}
        series: [
          {
            y: 'value'
            color: '#4682b4'
          }
          {
            y: 'x'
            axis: 'y2'
            type: 'column'
            color: '#4682b4'
          }
        ]
        tooltip: {mode: 'scrubber', interpolate: false}

    sinon.stub(d3, 'mouse', -> [0, 0])

  afterEach ->
    d3.mouse.restore()

  it 'should create one tooltip per series', ->
    tooltips = element.childrenByClass('scrubberItem')

    expect(tooltips.length).to.equal(2)

  it 'should show tooltips', ->
    glass = element.childByClass('glass')

    fakeMouse.hoverIn(glass)
    fakeMouse.mouseMove(glass)
    flushD3()
    expect(d3.mouse.callCount).to.equal(1)

    tooltips = element.childrenByClass('scrubberText')

    expect(tooltips[0].innerHTML()).to.equal('0 : 4')
    expect(tooltips[1].innerHTML()).to.equal('0 : 4')

    expect(tooltips[2].innerHTML()).to.equal('0 : 0')
    expect(tooltips[3].innerHTML()).to.equal('0 : 0')

  it 'should show tooltips with custom tooltip function', ->
    cb = sinon.spy((x, y, series) -> 'pouet')

    outerScope.$apply ->
      outerScope.options =
        axes: {x: {tooltipFormatter: (v) -> '$' + v}}
        series: [
          {y: 'value', color: '#4682b4'}
          {y: 'x', axis: 'y2', type: 'column', color: '#4682b4'}
        ]
        tooltip: {mode: 'scrubber', interpolate: false, callback: cb}

    glass = element.childByClass('glass')

    fakeMouse.hoverIn(glass)
    fakeMouse.mouseMove(glass)
    flushD3()
    expect(d3.mouse.callCount).to.equal(1)

    tooltips = element.childrenByClass('scrubberText')

    expect(tooltips[0].innerHTML()).to.equal('pouet')
    expect(tooltips[1].innerHTML()).to.equal('pouet')
    expect(tooltips[2].innerHTML()).to.equal('pouet')
    expect(tooltips[3].innerHTML()).to.equal('pouet')

    expect(cb.args[0]).to.eql([0, 4, outerScope.options.series[0]])
    expect(cb.args[1]).to.eql([0, 0, outerScope.options.series[1]])

