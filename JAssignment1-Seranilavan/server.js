require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const methodOverride = require('method-override');
const cors = require('cors');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Database models
const Project = require('./models/Project');
const Skill = require('./models/Skill');

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// View engine configuration (Pug)
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection with improved error handling
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};
connectDB();

// Enhanced Multer configuration for file uploads
const configureMulter = () => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
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

// Route handlers
const setupRoutes = () => {
  // Admin routes with upload middleware
  const adminRouter = require('./routes/admin')(upload);
  app.use('/admin', adminRouter);

  // API routes
  const apiRouter = require('./routes/api');
  app.use('/api', apiRouter);

  // Main routes
  app.get('/', async (req, res) => {
    try {
      const [projects, skills] = await Promise.all([
        Project.find().lean(),
        Skill.find().lean()
      ]);
      res.render('portfolio', { projects, skills });
    } catch (err) {
      console.error('Error fetching data:', err);
      res.status(500).render('error', { error: 'Failed to load portfolio data' });
    }
  });

  app.get('/portfolio', async (req, res) => {
    try {
      const [projects, skills] = await Promise.all([
        Project.find().lean() || [],
        Skill.find().lean() || []
      ]);
      res.render('portfolio', { projects, skills });
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      res.status(500).render('error', { error: 'Failed to load portfolio' });
    }
  });

  // Project form route
  app.get('/admin/projects/add', (req, res) => {
    res.render('addProject');
  });
};

setupRoutes();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle Multer errors specifically
  if (err instanceof multer.MulterError) {
    return res.status(400).render('error', { 
      error: `File upload error: ${err.message}` 
    });
  } else if (err) {
    return res.status(500).render('error', { 
      error: err.message || 'Something went wrong!' 
    });
  }
  
  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

// Server startup
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Upload directory: ${path.join(__dirname, 'public/uploads')}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  // Close server and exit process
  server.close(() => process.exit(1));
});