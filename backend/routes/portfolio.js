app.get('/portfolio', async (req, res) => {
    try {
        const projects = await Project.find();  
        const skills = await Skill.find();     

        res.render('portfolio', { projects, skills });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});
