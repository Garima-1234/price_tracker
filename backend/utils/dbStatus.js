/**
 * DB Status helper — exposes whether Mongoose is currently connected.
 * Routes use this to skip DB calls and return demo data when offline.
 */
const mongoose = require('mongoose');

const isDbConnected = () => mongoose.connection.readyState === 1;

module.exports = { isDbConnected };
