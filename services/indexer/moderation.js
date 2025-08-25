





// Basic keyword-based labeler for demonstration
const keywordFilters = {
  spam: ['free', 'win', 'click here'],
  nsfw: ['explicit content warning']
};

function getLabels(event) {
  const labels = [];

  // Check for spam keywords
  if (event.body && event.body.text) {
    Object.entries(keywordFilters).forEach(([label, keywords]) => {
      if (keywords.some(kw =>
        event.body.text.toLowerCase().includes(kw)
      )) {
        labels.push(label);
      }
    });
  }

  return labels;
}

module.exports = { getLabels };





