const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/buyhatke', { serverSelectionTimeoutMS: 2000 })
  .then(() => { console.log('LOCAL_BINGO'); process.exit(0); })
  .catch(() => { console.log('LOCAL_FAIL'); process.exit(1); });
