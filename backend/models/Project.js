const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  technologies: { type: String, required: true },
  link: { type: String },
  imagePath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);