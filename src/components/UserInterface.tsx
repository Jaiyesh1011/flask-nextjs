import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import CardComponent from './CardComponent';
import { useDebounce } from 'use-debounce';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';

interface User {
    id: number;
    name: string;
    email: string;
    specialty?: string;
    experience?: number;
}

interface UserInterfaceProps {
    backendName: string;
}

interface Filters {
    name: string;
    email: string;
    specialty: string;
    minExperience: string;
}

interface Pagination {
    page: number;
    limit: number;
}

const UserInterface: React.FC<UserInterfaceProps> = ({ backendName }) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    const [users, setUsers] = useState<User[]>([]);
    const [newUser, setNewUser] = useState({ name: '', email: '', specialty: '', experience: '' });
    const [updateUser, setUpdateUser] = useState({ id: '', name: '', email: '', specialty: '', experience: '' });
    const [filters, setFilters] = useState<Filters>({ 
        name: '', 
        email: '', 
        specialty: '', 
        minExperience: '' 
    });
    const [debouncedFilters] = useDebounce(filters, 500);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 8 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);

    const specialties = [
        'Cardiology',
        'Dermatology',
        'Endocrinology',
        'Gastroenterology',
        'Neurology',
        'Oncology',
        'Pediatrics',
        'Psychiatry'
    ];

    const backgroundColors: { [key: string]: string } = {
        flask: 'bg-blue-500',
    };

    const buttonColors: { [key: string]: string } = {
        flask: 'bg-blue-700 hover:bg-blue-600',
    };

    const bgColor = backgroundColors[backendName] || 'bg-blue-50';
    const btnColor = buttonColors[backendName] || 'bg-blue-600 hover:bg-blue-500';

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${apiUrl}/api/${backendName}/users`, {
                params: {
                    name_like: debouncedFilters.name,
                    email_like: debouncedFilters.email,
                    specialty: debouncedFilters.specialty,
                    experience_gte: debouncedFilters.minExperience,
                    _page: pagination.page,
                    _limit: pagination.limit,
                },
            });
            setUsers(response.data);
            setTotalUsers(parseInt(response.headers['x-total-count'] || '0', 10));
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || error.message);
            } else if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    }, [backendName, apiUrl, debouncedFilters, pagination]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const createUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await axios.post(`${apiUrl}/api/${backendName}/users`, {
                ...newUser,
                experience: parseInt(newUser.experience) || 0
            });
            setUsers([response.data, ...users]);
            setNewUser({ name: '', email: '', specialty: '', experience: '' });
            setSuccessMessage('Doctor added successfully!');
            setPagination({...pagination, page: 1}); // Reset to first page
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || error.message);
            } else if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Failed to add doctor.');
            }
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    const handleEditUser = (user: User) => {
        setUpdateUser({ 
            id: String(user.id), 
            name: user.name, 
            email: user.email,
            specialty: user.specialty || '',
            experience: user.experience?.toString() || ''
        });
        setIsUpdating(true);
        document.getElementById('update')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleUpdateUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await axios.put(`${apiUrl}/api/${backendName}/users/${updateUser.id}`, {
                name: updateUser.name,
                email: updateUser.email,
                specialty: updateUser.specialty,
                experience: parseInt(updateUser.experience) || 0
            });
            setUsers(users.map((user) =>
                user.id === parseInt(updateUser.id)
                    ? { 
                        ...user, 
                        name: updateUser.name, 
                        email: updateUser.email,
                        specialty: updateUser.specialty,
                        experience: parseInt(updateUser.experience) || 0
                    }
                    : user
            ));
            setUpdateUser({ id: '', name: '', email: '', specialty: '', experience: '' });
            setIsUpdating(false);
            setSuccessMessage('Doctor information updated successfully!');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || error.message);
            } else if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Failed to update doctor information.');
            }
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    const confirmDelete = (userId: number) => {
        setUserToDelete(userId);
        setShowDeleteModal(true);
    };

    const deleteUser = async () => {
        if (!userToDelete) return;
        
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            await axios.delete(`${apiUrl}/api/${backendName}/users/${userToDelete}`);
            setUsers(users.filter((user) => user.id !== userToDelete));
            setSuccessMessage('Doctor removed successfully!');
            setShowDeleteModal(false);
            setUserToDelete(null);
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || error.message);
            } else if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Failed to remove doctor.');
            }
        } finally {
            setLoading(false);
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value,
        });
        setPagination({ ...pagination, page: 1 }); // Reset page on filter change
    };

    const resetFilters = () => {
        setFilters({ 
            name: '', 
            email: '', 
            specialty: '', 
            minExperience: '' 
        });
    };

    const handlePageChange = (newPage: number) => {
        setPagination({ ...pagination, page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const totalPages = Math.ceil(totalUsers / pagination.limit);

    return (
        <div className="flex min-h-screen w-full bg-gray-50 font-sans">

            {/* Sidebar */}
            <aside className="fixed top-0 left-0 w-72 h-full bg-gradient-to-b from-blue-800 to-blue-600 text-white p-6 shadow-lg z-10">
                <div className="flex items-center justify-center mb-8">
                    <img
                        src="/medical-icon.svg"
                        alt="Medical Icon"
                        className="w-10 h-10 mr-3"
                    />
                    <h2 className="text-2xl font-bold">Doctor's Dashboard</h2>
                </div>
                <ul className="space-y-4">
                    <li>
                        <a 
                            href="#create" 
                            className="flex items-center text-lg hover:text-blue-200 transition duration-300 p-2 rounded hover:bg-blue-700"
                        >
                            <span className="mr-3">
                                <FiPlus />
                            </span>
                            Add Doctor
                        </a>
                    </li>
                    <li>
                        <a 
                            href="#list" 
                            className="flex items-center text-lg hover:text-blue-200 transition duration-300 p-2 rounded hover:bg-blue-700"
                        >
                            <span className="mr-3">
                                <FiSearch />
                            </span>
                            Doctor Directory
                        </a>
                    </li>
                </ul>
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-blue-700 p-4 rounded-lg">
                        <p className="text-sm">Total Doctors: {totalUsers}</p>
                        <p className="text-sm">Current Page: {pagination.page}/{totalPages}</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-72 w-full overflow-y-auto p-6 md:px-12 lg:px-16">

                <div className="w-full max-w-7xl mx-auto rounded-xl shadow-xl bg-white p-6 space-y-8">
                    <div className="text-center">
                        <img
                            src={`/${backendName}logo.svg`}
                            alt={`${backendName} Logo`}
                            className="w-16 h-16 mx-auto mb-4"
                        />
                        <h1 className="text-3xl font-extrabold text-gray-800 leading-tight">
                            Consult General Physicians Online Internal Medicine Specialists
                        </h1>
                    </div>

                    {/* Alert Messages */}
                    {successMessage && (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Success!</strong>
                            <span className="block sm:inline ml-2">{successMessage}</span>
                            <button 
                                onClick={() => setSuccessMessage(null)}
                                className="absolute top-1 right-1 text-green-700 hover:text-green-900"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Error!</strong>
                            <span className="block sm:inline ml-2">{error}</span>
                            <button 
                                onClick={() => setError(null)}
                                className="absolute top-1 right-1 text-red-700 hover:text-red-900"
                            >
                                <FiX size={20} />
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {!loading && (
                        <>
                            {/* Create Doctor Form */}
                            <section id="create" className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg shadow-lg">
                                <h2 className="text-xl font-semibold text-blue-900 mb-4">Add New Doctor</h2>
                                <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            placeholder="Doctor Name"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                                        <select
                                            value={newUser.specialty}
                                            onChange={(e) => setNewUser({ ...newUser, specialty: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                                        >
                                            <option value="">Select Specialty</option>
                                            {specialties.map(spec => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                                        <input
                                            type="number"
                                            placeholder="Years"
                                            min="0"
                                            max="50"
                                            value={newUser.experience}
                                            onChange={(e) => setNewUser({ ...newUser, experience: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="md:col-span-4 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition duration-300 flex items-center justify-center"
                                    >
                                        <span className="mr-2">
                                            <FiPlus />
                                        </span>
                                        Add Doctor
                                    </button>
                                </form>
                            </section>

                            {/* Update Doctor Form */}
                            <section id="update" className={`bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg shadow-lg transition-all duration-300 ${isUpdating ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-green-900">Update Doctor Info</h2>
                                    <button
                                        onClick={() => { setUpdateUser({ id: '', name: '', email: '', specialty: '', experience: '' }); setIsUpdating(false); }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <FiX size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleUpdateUserSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                                        <input
                                            placeholder="Doctor ID"
                                            value={updateUser.id}
                                            className="w-full p-3 border border-gray-300 rounded-md text-gray-800 bg-gray-100"
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            placeholder="Doctor Name"
                                            value={updateUser.name}
                                            onChange={(e) => setUpdateUser({ ...updateUser, name: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            placeholder="Email"
                                            value={updateUser.email}
                                            onChange={(e) => setUpdateUser({ ...updateUser, email: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                                        <select
                                            value={updateUser.specialty}
                                            onChange={(e) => setUpdateUser({ ...updateUser, specialty: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800"
                                        >
                                            <option value="">Select Specialty</option>
                                            {specialties.map(spec => (
                                                <option key={spec} value={spec}>{spec}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                                        <input
                                            type="number"
                                            placeholder="Years"
                                            min="0"
                                            max="50"
                                            value={updateUser.experience}
                                            onChange={(e) => setUpdateUser({ ...updateUser, experience: e.target.value })}
                                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800"
                                        />
                                    </div>
                                    <div className="md:col-span-5 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-400 transition duration-300 flex items-center"
                                            onClick={() => { setUpdateUser({ id: '', name: '', email: '', specialty: '', experience: '' }); setIsUpdating(false); }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition duration-300 flex items-center"
                                        >
                                            Update Doctor
                                        </button>
                                    </div>
                                </form>
                            </section>

                            {/* Doctor List */}
                            <section id="list" className="space-y-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-semibold text-gray-700">Doctor Directory</h2>
                                    <div className="text-sm text-gray-500">
                                        Showing {users.length} of {totalUsers} doctors
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder="Filter by Name"
                                                    name="name"
                                                    value={filters.name}
                                                    onChange={handleFilterChange}
                                                    className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                />
                                                <span className="absolute left-3 top-3.5 text-gray-400">
                                                    <FiSearch />
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    placeholder="Filter by Email"
                                                    name="email"
                                                    value={filters.email}
                                                    onChange={handleFilterChange}
                                                    className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                />
                                                <span className="absolute left-3 top-3.5 text-gray-400">
                                                    <FiSearch />
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                                            <select
                                                name="specialty"
                                                value={filters.specialty}
                                                onChange={handleFilterChange}
                                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            >
                                                <option value="">All Specialties</option>
                                                {specialties.map(spec => (
                                                    <option key={spec} value={spec}>{spec}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience</label>
                                            <select
                                                name="minExperience"
                                                value={filters.minExperience}
                                                onChange={handleFilterChange}
                                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            >
                                                <option value="">Any</option>
                                                <option value="5">5+ years</option>
                                                <option value="10">10+ years</option>
                                                <option value="15">15+ years</option>
                                                <option value="20">20+ years</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={resetFilters}
                                                className="w-full bg-gray-200 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-300 transition duration-300"
                                            >
                                                Reset Filters
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {users.length === 0 ? (
                                    <div className="bg-gray-50 p-8 rounded-lg text-center">
                                        <p className="text-gray-500 text-lg">No doctors found matching your criteria.</p>
                                        <button 
                                            onClick={resetFilters}
                                            className="mt-4 text-blue-600 hover:text-blue-800"
                                        >
                                            Reset filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {users.map((user) => (
                                            <div
                                                key={user.id}
                                                className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition duration-300 overflow-hidden"
                                            >
                                                <div className="p-6">
                                                    <CardComponent card={user} />
                                                </div>
                                                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-md transition duration-300"
                                                        title="Edit"
                                                    >
                                                        <FiEdit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(user.id)}
                                                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md transition duration-300"
                                                        title="Delete"
                                                    >
                                                        <FiTrash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col sm:flex-row justify-between items-center mt-8 gap-4">
                                        <div className="text-sm text-gray-600">
                                            Page {pagination.page} of {totalPages} • {totalUsers} total doctors
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handlePageChange(pagination.page - 1)}
                                                disabled={pagination.page <= 1}
                                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition duration-300"
                                            >
                                                <span className="mr-1">
                                                    <FiChevronLeft />
                                                </span>
                                                Previous
                                            </button>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (pagination.page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (pagination.page >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = pagination.page - 2 + i;
                                                }
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`px-4 py-2 rounded-md transition duration-300 ${pagination.page === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => handlePageChange(pagination.page + 1)}
                                                disabled={pagination.page >= totalPages}
                                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition duration-300"
                                            >
                                                Next
                                                <span className="ml-1">
                                                    <FiChevronRight />
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to remove this doctor? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setUserToDelete(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={deleteUser}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
                            >
                                Delete Doctor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserInterface;