const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Skill = require("../models/Skill");

// GET: Return all projects as JSON with image URLs
router.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }).lean();
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ 
      error: "Failed to fetch projects",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET: Return single project by ID
router.get("/projects/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ 
      error: "Failed to fetch project",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET: Return all skills as JSON
router.get("/skills", async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 }).lean();
    res.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ 
      error: "Failed to fetch skills",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;