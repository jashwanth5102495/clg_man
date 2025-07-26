import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/Layout/Header';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import toast from 'react-hot-toast';
import axios from 'axios';

interface ClassData {
  classId: string;
  classCode: string;
  university: string;
  course: string;
  year: number;
  semester: number;
  teacherName: string;
  classStrength: number;
  boys: number;
  girls: number;
  credentials: {
    username: string;
  };
  createdAt: string;
  subjects?: { name: string; teacherName: string }[];
}

const ClassDetails: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const response = await axios.get(`/api/classes/id/${classId}`);
        setClassData(response.data.class);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to fetch class details');
        navigate('/admin/dashboard');
      } finally {
        setLoading(false);
      }
    };
    if (classId) fetchClass();
  }, [classId, navigate]);

  if (loading) {
    return <div className="min-h-screen bg-neutral-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>;
  }

  if (!classData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-900 dark:bg-white">
      <Header title={`Class Details: ${classData.classCode}`} showBack backPath="/admin/dashboard" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8 bg-neutral-800 dark:bg-gray-100">
          <h2 className="text-2xl font-bold text-white dark:text-black mb-4">Class Information</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-gray-300 dark:text-gray-800"><strong>Class Code:</strong> {classData.classCode}</p>
              <p className="text-gray-300 dark:text-gray-800"><strong>University:</strong> {classData.university}</p>
              <p className="text-gray-300 dark:text-gray-800"><strong>Course:</strong> {classData.course}</p>
              <p className="text-gray-300 dark:text-gray-800"><strong>Year:</strong> {classData.year}</p>
              <p className="text-gray-300 dark:text-gray-800"><strong>Semester:</strong> {classData.semester}</p>
              <p className="text-gray-300 dark:text-gray-800"><strong>Teacher:</strong> {classData.teacherName}</p>
            </div>
            <div>
              <p className="text-gray-300 dark:text-gray-800"><strong>Class Strength:</strong> {classData.classStrength}</p>
              <p className="text-gray-300 dark:text-gray-800"><strong>Boys:</strong> {classData.boys}</p>
              <p className="text-gray-300 dark:text-gray-800"><strong>Girls:</strong> {classData.girls}</p>
              <p className="text-gray-300 dark:text-gray-800"><strong>Username:</strong> {classData.credentials.username}</p>
              <p className="text-gray-300 dark:text-gray-800"><strong>Created At:</strong> {new Date(classData.createdAt).toLocaleString()}</p>
              <p className="text-gray-300 dark:text-gray-800"><strong>Class ID:</strong> {classData.classId}</p>
            </div>
          </div>
          {classData.subjects && classData.subjects.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-white dark:text-black mb-2">Subjects</h3>
              <ul className="list-disc pl-6">
                {classData.subjects.map((subj, idx) => (
                  <li key={idx} className="text-gray-300 dark:text-gray-800">
                    <strong>{subj.name}</strong> - {subj.teacherName}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ClassDetails; 