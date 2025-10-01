

const parseLocation = (req) => {
  try {
    let lat, lon;

    if (req.method === 'GET') {
      lat = parseFloat(req.query.latitude);
      lon = parseFloat(req.query.longitude);
    } else {
      const raw = req.body.location;

      const loc = typeof raw === 'string'
        ? JSON.parse(raw)
        : raw;

      lat = parseFloat(loc?.latitude);
      lon = parseFloat(loc?.longitude);
    }

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid location coordinates');
    }

    return {
      type: 'Point',
      coordinates: [lon, lat],
    };
  } catch (err) {
    console.log(err);
    throw new Error('Invalid location format');
  }
}

//Used in getUsersNearMyLocation (user.service) and getVisiblePostsForViewer (post.service)
const geographicFilter = (location, radius) => {
  let geoFilter = {};
  if (location?.coordinates &&
    Array.isArray(location.coordinates) &&
    location.coordinates.length === 2
  ) {
    geoFilter = {
      location: {
        $geoWithin: {
          $centerSphere: [location.coordinates, radius / 6371] //km
        }
      }
    };
  }
  return geoFilter;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return Math.round(d); // in meters
};

const buildAddress = (tags) => {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'] || tags['addr:town'],
    tags['addr:state'],
    tags['addr:postcode'],
    tags['addr:country']
  ];
  return parts.filter(Boolean).join(', ');
};



module.exports = {
  parseLocation,
  geographicFilter,
  calculateDistance,
  buildAddress
};
