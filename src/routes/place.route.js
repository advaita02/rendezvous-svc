const express = require('express');
const router = express.Router();
const placeController = require('../controllers/place.controller');
const protect = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /places/autosuggest:
 *   get:
 *     summary: Autosuggest places (HERE Maps)
 *     description: Returns a list of suggested places or categories using HERE Maps based on user input and location.
 *     tags:
 *       - Places
 *     parameters:
 *       - in: query
 *         name: input
 *         schema:
 *           type: string
 *           example: coffee
 *         required: false
 *         description: Search keyword (e.g., coffee shop, restaurant, park...)
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           example: 10.7377548
 *         required: false
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           example: 106.7297128
 *         required: false
 *         description: Longitude
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           example: 10
 *         required: false
 *         description: Limit
 *     responses:
 *       200:
 *         description: List of suggested places or category queries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     description: Display title of the suggestion
 *                   id:
 *                     type: string
 *                     description: Unique identifier (place ID or category ID)
 *                   resultType:
 *                     type: string
 *                     description: Type of result (e.g., "place", "categoryQuery")
 *                   href:
 *                     type: string
 *                     description: URL to perform discovery on the category (only if resultType is categoryQuery)
 *                   address:
 *                     type: object
 *                     description: Address information (only for place-type results)
 *                     properties:
 *                       label:
 *                         type: string
 *                   position:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                   access:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                         lng:
 *                           type: number
 *                   distance:
 *                     type: number
 *                     description: Distance from the user's coordinates in meters
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         primary:
 *                           type: boolean
 *                   references:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         supplier:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                         id:
 *                           type: string
 *                   highlights:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             start:
 *                               type: integer
 *                             end:
 *                               type: integer
 *                       address:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 start:
 *                                   type: integer
 *                                 end:
 *                                   type: integer
 *       400:
 *         description: Missing or invalid query parameters
 *       500:
 *         description: Autosuggest error
 */
router.get('/autosuggest', placeController.autosuggest);

/**
 * @swagger
 * /places/nearby:
 *   get:
 *     summary: Get list of nearby places based on user location (HERE Maps)
 *     description: Returns a list of nearby places around the given location using HERE Browse API.
 *     tags:
 *       - Places
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           example: 10.73773
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           example: 106.72969
 *         description: Longitude
 *       - in: query
 *         name: radius
 *         required: true
 *         schema:
 *           type: number
 *           example: 500
 *         description: Search radius in meters
 *       - in: query
 *         name: limit
 *         required: true
 *         schema:
 *           type: number
 *           example: 10
 *         description: Maximum number of results to return
 *     responses:
 *       200:
 *         description: List of nearby places
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: "Trung Tâm Mua Sắm Nguyễn Kim"
 *                   id:
 *                     type: string
 *                     example: "here:pds:place:704w3gvh-ff741447cb9c4400914b4720259630a5"
 *                   language:
 *                     type: string
 *                     example: "vi"
 *                   resultType:
 *                     type: string
 *                     example: "place"
 *                   address:
 *                     type: object
 *                     properties:
 *                       label:
 *                         type: string
 *                       countryCode:
 *                         type: string
 *                       countryName:
 *                         type: string
 *                       county:
 *                         type: string
 *                       city:
 *                         type: string
 *                       district:
 *                         type: string
 *                       street:
 *                         type: string
 *                       postalCode:
 *                         type: string
 *                   position:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *                   access:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         lat:
 *                           type: number
 *                         lng:
 *                           type: number
 *                   distance:
 *                     type: number
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         primary:
 *                           type: boolean
 *                   payment:
 *                     type: object
 *                     properties:
 *                       methods:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             currencies:
 *                               type: array
 *                               items:
 *                                 type: string
 *                             accepted:
 *                               type: boolean
 *                   references:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         supplier:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                         id:
 *                           type: string
 *                   foodTypes:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         primary:
 *                           type: boolean
 *                   contacts:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         phone:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: string
 *                         www:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: string
 *                               categories:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     id:
 *                                       type: string
 *                   openingHours:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         categories:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                         text:
 *                           type: array
 *                           items:
 *                             type: string
 *                         isOpen:
 *                           type: boolean
 *                         structured:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               start:
 *                                 type: string
 *                               duration:
 *                                 type: string
 *                               recurrence:
 *                                 type: string
 *       400:
 *         description: Missing or invalid query parameters
 *       500:
 *         description: Browse search error!
 */
router.get('/nearby', placeController.browseSearch);

/**
 * @swagger
 * /places/geocode/reverse:
 *   get:
 *     summary: Reverse geocode (HERE Maps)
 *     description: Returns address details from latitude and longitude using HERE Reverse Geocoding API.
 *     tags:
 *       - Places
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           example: 10.7955
 *         required: true
 *         description: Latitude coordinate
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           example: 106.74537
 *         required: true
 *         description: Longitude coordinate
 *     responses:
 *       200:
 *         description: Address information for the given location
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                   example: "93 Đường Nguyễn Hoàng, Phường An Phú, Thủ Đức, Hồ Chí Minh, Việt Nam"
 *                 id:
 *                   type: string
 *                   example: "here:af:streetsection:LjpaKk9oS-xpwkVXi8hgLC:CggIBCDD5qSkAxABGgI5Mw"
 *                 resultType:
 *                   type: string
 *                   example: "houseNumber"
 *                 houseNumberType:
 *                   type: string
 *                   example: "PA"
 *                 address:
 *                   type: object
 *                   properties:
 *                     label:
 *                       type: string
 *                       example: "93 Đường Nguyễn Hoàng, Phường An Phú, Thủ Đức, Hồ Chí Minh, Việt Nam"
 *                     countryCode:
 *                       type: string
 *                       example: "VNM"
 *                     countryName:
 *                       type: string
 *                       example: "Việt Nam"
 *                     county:
 *                       type: string
 *                       example: "Hồ Chí Minh"
 *                     city:
 *                       type: string
 *                       example: "Thủ Đức"
 *                     district:
 *                       type: string
 *                       example: "Phường An Phú"
 *                     street:
 *                       type: string
 *                       example: "Đường Nguyễn Hoàng"
 *                     postalCode:
 *                       type: string
 *                       example: "71106"
 *                     houseNumber:
 *                       type: string
 *                       example: "93"
 *                 position:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                       example: 10.7955
 *                     lng:
 *                       type: number
 *                       example: 106.74537
 *                 access:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                         example: 10.79548
 *                       lng:
 *                         type: number
 *                         example: 106.74518
 *                 distance:
 *                   type: number
 *                   example: 93
 *                 mapView:
 *                   type: object
 *                   properties:
 *                     west:
 *                       type: number
 *                       example: 106.74396
 *                     south:
 *                       type: number
 *                       example: 10.79111
 *                     east:
 *                       type: number
 *                       example: 106.74645
 *                     north:
 *                       type: number
 *                       example: 10.80184
 *       400:
 *         description: Missing or invalid query parameters
 *       500:
 *         description: Reverse geocoding error
 */
router.get('/geocode/reverse', placeController.reverseGeocode);

module.exports = router;