const axios = require('axios');

const { buildAddress, calculateDistance } = require('../utils/location.utils');

// [GET] /places/autosuggest
const autosuggest = async (req, res) => {
  try {
    const { input, lat, lng, limit } = req.query;
    const encodedInput = encodeURIComponent(input);

    const url = `https://autosuggest.search.hereapi.com/v1/autosuggest` +
      `?q=${encodedInput}` +
      `&at=${lat},${lng}` +
      `&lang=en-US` +
      `&limit=${limit}` +
      `&apikey=${process.env.HERE_API_KEY}`;

    const response = await axios.get(url);
    res.json(response.data.items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Autosuggest error!' });
  }
};

// [GET] /places/browse
const browseSearch = async (req, res) => {
  try {
    const { lat, lng, radius, limit } = req.query;
    if (!lat || !lng || !radius || !limit) {
      return res.status(400).json({ message: "Missing or invalid query parameters" });
    }
    const url = `https://browse.search.hereapi.com/v1/browse`
      + `?at=${lat},${lng}`
      + `&in=circle:${lat},${lng};r=${radius}`
      + `&limit=${limit}`
      + `&lang=en-US`
      + `&apikey=${process.env.HERE_API_KEY}`;

    const response = await axios.get(url);
    res.json(response.data.items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Browse search error!' });
  }
};


// [GET] /places/geocode/reverse
const reverseGeocode = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: "Missing or invalid query parameters" });
    }
    const url = `https://revgeocode.search.hereapi.com/v1/revgeocode`
      + `?at=${lat},${lng}`
      + `&lang=en-US`
      + `&apikey=${process.env.HERE_API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data.items?.[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Reverse geocoding error!' });
  }
};

module.exports = {
  autosuggest,
  browseSearch,
  reverseGeocode
};