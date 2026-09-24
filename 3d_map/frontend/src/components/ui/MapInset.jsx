import { useEffect, useMemo, useRef } from 'react'
import { AttributionControl, Map as MapLibreMap, NavigationControl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const MAP_STYLE = {
  version: 8,
  sources: {
    imagery: {
      type: 'raster',
      tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© Esri, Maxar, Earthstar Geographics',
    },
    property: {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
  },
  layers: [
    { id: 'imagery', type: 'raster', source: 'imagery' },
    {
      id: 'property-fill',
      type: 'fill',
      source: 'property',
      paint: { 'fill-color': '#176B55', 'fill-opacity': 0.42 },
    },
    {
      id: 'property-outline',
      type: 'line',
      source: 'property',
      paint: { 'line-color': '#FFFFFF', 'line-width': 3 },
    },
  ],
}

function boundsForGeometry(geometry) {
  const coordinates = geometry?.type === 'Polygon'
    ? geometry.coordinates.flat()
    : geometry?.type === 'MultiPolygon'
      ? geometry.coordinates.flat(2)
      : []
  if (!coordinates.length) return null

  const bounds = coordinates.reduce(
    (result, [longitude, latitude]) => result.extend([longitude, latitude]),
    [[coordinates[0][0], coordinates[0][1]], [coordinates[0][0], coordinates[0][1]]],
  )
  return bounds
}

export default function MapInset({ geometry, highlightUnit = false, ulpin, address, label }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const propertyFeature = useMemo(
    () => (geometry ? { type: 'Feature', properties: {}, geometry } : null),
    [geometry],
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [80.23, 13.04],
      zoom: 15,
      attributionControl: false,
      interactive: false,
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new AttributionControl({ compact: true }), 'bottom-right')
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !propertyFeature) return

    const update = () => {
      map.resize()
      const source = map.getSource('property')
      if (source) source.setData({ type: 'FeatureCollection', features: [propertyFeature] })
      const bounds = boundsForGeometry(propertyFeature.geometry)
      if (bounds) map.fitBounds(bounds, { padding: 48, maxZoom: 18, duration: 0 })
    }

    if (map.isStyleLoaded()) update()
    else map.once('load', update)
  }, [propertyFeature])

  return (
    <div className="property-map-inset">
      <div ref={containerRef} className="property-map-canvas" aria-label={`Map showing ${address || label || 'property location'}`} />
      <div className="property-map-label">
        {label && <div className="property-map-title">{label}</div>}
        {address && <div className="property-map-address">{address}</div>}
        <div className="property-map-ulpin">Parcel {ulpin}</div>
      </div>
      {highlightUnit && <span className="property-map-badge">LIVE MAP</span>}
    </div>
  )
}
