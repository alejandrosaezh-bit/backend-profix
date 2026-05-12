const fs = require('fs');
const files = [
'src/components/home/ProHomeComponents.js',
'src/components/HomeComponents.js',
'src/components/profile/ClientProfileComponents.js',
'src/components/profile/ClientProfileModals.js',
'src/components/profile/ProProfileComponents.js',
'src/components/profile/ProProfileModals.js',
'src/screens/AdminScreens.js',
'src/screens/BlogPostScreen.js',
'src/screens/CategoryDetailScreen.js',
'src/screens/ChatListScreen.js',
'src/screens/ChatScreen.js',
'src/screens/ClientProfileView.js',
'src/screens/CloseRequestModal.js',
'src/screens/CreateRequestScreen.js',
'src/screens/HomeScreen.js',
'src/screens/JobDetailPro.js',
'src/screens/ManageJobModal.js',
'src/screens/PortfolioSelectionModal.js',
'src/screens/ProfessionalJobView.js',
'src/screens/ProfessionalProfilePublicModal.js',
'src/screens/ProjectTimeline.js',
'src/screens/RequestDetailClient.js',
'src/screens/RequestDetailScreen.js',
'src/screens/ServiceForm.js',
'src/screens/SubcategoryDetailScreen.js'
];
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  try {
      require('@babel/parser').parse(content, { sourceType: 'module', plugins: ['jsx'] });
  } catch(e) {
      console.log('Error in ' + f + ': ' + e.message);
  }
});
