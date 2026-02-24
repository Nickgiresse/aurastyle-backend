import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB déconnecté, tentative de reconnexion...');
      setTimeout(connectDB, 5000);
    });

    await mongoose.connect(process.env.MONGODB_URI!, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    console.log('MongoDB connecté:', mongoose.connection.host);
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    setTimeout(connectDB, 5000); // retry après 5s
  }
};

export default connectDB;
