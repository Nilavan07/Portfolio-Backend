const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Skill = require("../models/Skill");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsPromises = fs.promises;

// Configure Multer storage with enhanced error handling
const configureMulter = () => {
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const uploadDir = path.join(__dirname, '../public/uploads');
        await fsPromises.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const fileFilter = (req, file, cb) => {
    const filetypes = /jpe?g|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, WEBP) are allowed!'), false);
    }
  };

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter
  });
};

const upload = configureMulter();

// Helper function for error handling
const handleError = (res, err, message = 'Server Error') => {
  console.error(message, err);
  res.status(500).render('error', { error: message });
};

// Helper function for file cleanup
const cleanupFile = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      await fsPromises.unlink(filePath);
    }
  } catch (err) {
    console.error('Error cleaning up file:', err);
  }
};

// GET: Admin Dashboard
router.get("/", async (req, res) => {
  try {
    const [projects, skills] = await Promise.all([
      Project.find().sort({ createdAt: -1 }).lean(),
      Skill.find().lean()
    ]);
    res.render("admin", { projects, skills });
  } catch (err) {
    handleError(res, err, 'Error fetching admin data');
  }
});

// Project Routes
router.get("/projects/add", (req, res) => {
  res.render("addProject");
});

router.post("/projects/add", upload.single('image'), async (req, res) => {
  try {
    const { name, description, technologies, link } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : null;

    const newProject = new Project({
      name,
      description,
      technologies,
      link,
      imagePath
    });

    await newProject.save();
    res.redirect("/admin");
  } catch (err) {
    if (req.file) {
      await cleanupFile(path.join(__dirname, '../public/uploads', req.file.filename));
    }
    handleError(res, err, 'Error adding project');
  }
});

router.get("/projects/edit/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) return res.status(404).render('404');
    res.render("editProject", { project });
  } catch (err) {
    handleError(res, err, 'Error fetching project');
  }
});

router.post("/projects/edit/:id", upload.single('image'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).render('404');

    const updateData = { ...req.body };

    if (req.file) {
      // Delete old image if exists
      if (project.imagePath) {
        await cleanupFile(path.join(__dirname, '../public', project.imagePath));
      }
      updateData.imagePath = '/uploads/' + req.file.filename;
    }

    await Project.findByIdAndUpdate(req.params.id, updateData);
    res.redirect("/admin");
  } catch (err) {
    if (req.file) {
      await cleanupFile(path.join(__dirname, '../public/uploads', req.file.filename));
    }
    handleError(res, err, 'Error updating project');
  }
});

router.delete("/projects/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).render('404');

    // Delete associated image file
    if (project.imagePath) {
      await cleanupFile(path.join(__dirname, '../public', project.imagePath));
    }

    await Project.findByIdAndDelete(req.params.id);
    res.redirect("/admin");
  } catch (err) {
    handleError(res, err, 'Error deleting project');
  }
});

// Skill Routes
router.get("/skills/add", (req, res) => {
  res.render("addSkill");
});

router.post("/skills/add", async (req, res) => {
  try {
    const newSkill = new Skill({
      name: req.body.name,
      proficiency: req.body.proficiency,
    });
    await newSkill.save();
    res.redirect("/admin");
  } catch (err) {
    handleError(res, err, 'Error adding skill');
  }
});

router.get("/skills/edit/:id", async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id).lean();
    if (!skill) return res.status(404).render('404');
    res.render("editSkill", { skill });
  } catch (err) {
    handleError(res, err, 'Error fetching skill');
  }
});

router.post("/skills/edit/:id", async (req, res) => {
  try {
    await Skill.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/admin");
  } catch (err) {
    handleError(res, err, 'Error updating skill');
  }
});

router.delete("/skills/:id", async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.redirect("/admin");
  } catch (err) {
    handleError(res, err, 'Error deleting skill');
  }
});

module.exports = (upload) => router;