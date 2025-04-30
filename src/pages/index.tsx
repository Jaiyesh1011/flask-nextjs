import React from 'react';
import UserInterface from '../components/UserInterface';

const Home: React.FC = () => {
  return (
    
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-10">
      <div className="w-full max-w-5xl p-4 bg-white rounded-lg shadow-lg">
        <UserInterface backendName="flask" />
      </div>
    </div>
  );
};

export default Home;
