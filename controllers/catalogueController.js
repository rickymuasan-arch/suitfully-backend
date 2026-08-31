const Catalogue = require('../models/Catalogue');

// Get all catalogue (for public site)
exports.getCatalogue = async (req, res) => {
  try {
    const catalogue = await Catalogue.find();
    const result = {};
    catalogue.forEach(item => {
      result[item.key] = {
        title: item.title,
        description: item.description,
        images: item.images
      };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create catalogue item
exports.createCatalogue = async (req, res) => {
  try {
    const catalogue = new Catalogue(req.body);
    await catalogue.save();
    res.status(201).json(catalogue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update catalogue item
exports.updateCatalogue = async (req, res) => {
  try {
    const catalogue = await Catalogue.findOneAndUpdate(
      { key: req.params.key },
      req.body,
      { new: true, runValidators: true }
    );
    if (!catalogue) {
      return res.status(404).json({ error: 'Catalogue item not found' });
    }
    res.json(catalogue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete catalogue item
exports.deleteCatalogue = async (req, res) => {
  try {
    const catalogue = await Catalogue.findOneAndDelete({ key: req.params.key });
    if (!catalogue) {
      return res.status(404).json({ error: 'Catalogue item not found' });
    }
    res.json({ message: 'Catalogue item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};