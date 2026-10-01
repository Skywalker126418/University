import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  Mail,
  Phone,
  Shield,
  Download,
  CheckCircle,
  XCircle,
  Trash2,
  Camera,
  X,
  User,
} from 'lucide-react';
import { authService } from '../../services/authService';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const RegistrarsPage = () => {
  const toast = useToast();
  const [registrars, setRegistrars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Registrar Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRegistrars = async () => {
    try {
      setLoading(true);
      const res = await authService.getRegistrars();
      const data = res?.data || res || [];
      setRegistrars(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to load registrars.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrars();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be under 5MB.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateRegistrar = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setIsSaving(true);
      const data = new FormData();
      data.append('first_name', formData.first_name);
      data.append('last_name', formData.last_name);
      data.append('email', formData.email);
      data.append('password', formData.password);
      data.append('phone', formData.phone);
      if (avatarFile) {
        data.append('photo', avatarFile);
      }

      await authService.createRegistrar(data);
      toast.success('Registrar account created successfully.');
      setIsModalOpen(false);
      setFormData({ first_name: '', last_name: '', email: '', password: '', phone: '' });
      setAvatarFile(null);
      setAvatarPreview(null);
      fetchRegistrars();
    } catch (err) {
      toast.error(err.message || 'Failed to create registrar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle-status`);
      toast.success('Registrar status updated.');
      fetchRegistrars();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  const handleDeleteRegistrar = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate registrar ${name}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Registrar account deactivated.');
      fetchRegistrars();
    } catch (err) {
      toast.error('Failed to deactivate registrar.');
    }
  };

  const handleExportCSV = () => {
    if (registrars.length === 0) {
      toast.warning('No registrar data to export.');
      return;
    }

    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Created At'];
    const rows = registrars.map((r) => [
      r.id,
      `"${r.first_name || ''}"`,
      `"${r.last_name || ''}"`,
      `"${r.email || ''}"`,
      `"${r.phone || ''}"`,
      r.is_active ? 'Active' : 'Inactive',
      r.created_at || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `registrars_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Registrars CSV downloaded.');
  };

  const filteredRegistrars = registrars.filter((r) => {
    const term = search.toLowerCase();
    const fullName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
    return (
      fullName.includes(term) ||
      (r.email && r.email.toLowerCase().includes(term)) ||
      (r.phone && r.phone.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Registrars Management</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Institutional academic officers authorized to enroll students and manage course registration periods.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center gap-2 text-xs py-2 px-3 border-slate-700 bg-black-surface hover:bg-slate-800 text-white"
          >
            <Download className="w-4 h-4 text-blue-400" />
            Export Directory
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 text-xs py-2 px-3.5 bg-darkblue hover:bg-darkblue-royal text-white font-semibold rounded-xl border border-darkblue-border shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add New Registrar
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search registrars by name, email, or telephone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:border-darkblue focus:ring-1 focus:ring-darkblue"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner message="Loading academic registrar records..." />
          </div>
        ) : filteredRegistrars.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-text-secondary">
              <Shield className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text-dark">No Registrars Found</p>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              {search ? 'No registrar records matched your search query.' : 'There are currently no registrar accounts registered. Click "Add New Registrar" to create one.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-text-secondary font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Registrar</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRegistrars.map((reg) => (
                  <tr key={reg.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-darkblue flex items-center justify-center text-white font-bold flex-shrink-0 border border-border">
                        {reg.avatar ? (
                          <img
                            src={reg.avatar.startsWith('http') ? reg.avatar : `http://localhost:5000${reg.avatar}`}
                            alt={reg.first_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{reg.first_name?.[0]}{reg.last_name?.[0]}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-text-dark text-sm">
                          {reg.first_name} {reg.last_name}
                        </p>
                        <p className="text-[11px] text-text-secondary font-mono">REG-ID: #{reg.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary font-medium">{reg.email}</td>
                    <td className="px-6 py-4 text-text-secondary">{reg.phone || '—'}</td>
                    <td className="px-6 py-4">
                      {reg.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleStatus(reg.id)}
                        className="px-2.5 py-1 rounded-lg border border-border hover:bg-slate-100 text-[11px] font-semibold text-text-dark transition-colors"
                      >
                        {reg.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteRegistrar(reg.id, `${reg.first_name} ${reg.last_name}`)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors inline-flex items-center"
                        title="Delete registrar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add New Registrar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-black-card text-white w-full max-w-lg rounded-2xl shadow-2xl border border-darkblue-border overflow-hidden">
            <div className="bg-darkblue px-6 py-4 flex items-center justify-between border-b border-darkblue-border">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Create Academic Registrar</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRegistrar} className="p-6 space-y-4">
              {/* Photo Upload */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-black-surface border border-slate-800">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-darkblue border border-darkblue-border flex items-center justify-center flex-shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-white">Registrar Photo</p>
                  <label className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload portrait photo</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="First name"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-black-surface border border-slate-700 text-white focus:border-darkblue-accent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    className="w-full text-xs px-3 py-2 rounded-xl bg-black-surface border border-slate-700 text-white focus:border-darkblue-accent outline-none"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Institutional Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. registrar@university.edu"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-black-surface border border-slate-700 text-white focus:border-darkblue-accent outline-none"
                  required
                />
              </div>

              {/* Initial Password to give the registrar */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assigned Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Initial password for registrar login"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-black-surface border border-slate-700 text-white focus:border-darkblue-accent outline-none"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The registrar can change this password at any time inside their profile portal.
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1-555-0100"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-black-surface border border-slate-700 text-white focus:border-darkblue-accent outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs py-2 px-4 border-slate-700 bg-transparent text-slate-300 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isSaving}
                  className="text-xs py-2 px-4 bg-darkblue hover:bg-darkblue-royal text-white font-semibold rounded-xl border border-darkblue-border"
                >
                  Save & Create Registrar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarsPage;
