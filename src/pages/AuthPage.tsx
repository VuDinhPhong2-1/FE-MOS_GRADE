import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail } from 'lucide-react';
import type {
    LoginFormData,
    RegisterFormData,
    LoginResponse,
} from '../types/auth.types';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState<RegisterFormData>({
        username: '',
        password: '',
        email: '',
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setError('');

        const baseUrl = 'https://localhost:7223/api/auth';
        const endpoint = isLogin ? `${baseUrl}/login` : `${baseUrl}/register`;

        try {
            const body: LoginFormData | RegisterFormData = isLogin
                ? { username: formData.username, password: formData.password }
                : formData;

            console.log('📡 Sending request to:', endpoint);
            console.log('📦 Request body:', body);

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ Error response:', errorData);
                throw new Error(errorData.message || 'Có lỗi xảy ra');
            }

            if (isLogin) {
                // ✅ SỬA: Đổi tên biến từ "LoginResponse" thành "data"
                const data: LoginResponse = await response.json();
                console.log('✅ Login response:', data);

                // ✅ KIỂM TRA TOKEN
                if (!data.accessToken || !data.refreshToken) {
                    console.error('❌ Missing tokens in response!');
                    throw new Error('Server không trả về token');
                }

                console.log('🔑 Access Token:', data.accessToken.substring(0, 50) + '...');
                console.log('🔑 Refresh Token:', data.refreshToken.substring(0, 50) + '...');

                // ✅ GỌI LOGIN VỚI userId
                login(
                    {
                        userId: data.userId,
                        username: data.username,
                        email: data.email,
                        role: data.role,
                        fullName: data.fullName,
                        avatar: data.avatar,
                        permissions: data.permissions,
                    },
                    data.accessToken,
                    data.refreshToken
                );

                console.log('✅ Login successful, navigating to dashboard...');
                navigate('/dashboard');
            } else {
                await response.json();
                alert('Đăng ký thành công! Vui lòng đăng nhập.');
                setIsLogin(true);
                setFormData({ username: '', password: '', email: '' });
            }
        } catch (err) {
            console.error('❌ Error:', err);
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6">
                    {isLogin ? '🔐 Đăng Nhập' : '📝 Đăng Ký Tài Khoản'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 text-red-700 bg-red-100 rounded text-sm text-center">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="flex items-center border rounded px-3 py-2 focus-within:border-blue-500">
                            <Mail size={20} className="text-gray-400 mr-2" />
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                required
                                className="w-full outline-none"
                                onChange={handleChange}
                                value={formData.email}
                            />
                        </div>
                    )}

                    <div className="flex items-center border rounded px-3 py-2 focus-within:border-blue-500">
                        <User size={20} className="text-gray-400 mr-2" />
                        <input
                            type="text"
                            name="username"
                            placeholder="Tên đăng nhập"
                            required
                            className="w-full outline-none"
                            onChange={handleChange}
                            value={formData.username}
                        />
                    </div>

                    <div className="flex items-center border rounded px-3 py-2 focus-within:border-blue-500">
                        <Lock size={20} className="text-gray-400 mr-2" />
                        <input
                            type="password"
                            name="password"
                            placeholder="Mật khẩu"
                            required
                            className="w-full outline-none"
                            onChange={handleChange}
                            value={formData.password}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium"
                    >
                        {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
                    </button>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                    <span
                        className="text-blue-600 cursor-pointer ml-1 font-semibold hover:underline"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                    >
                        {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                    </span>
                </p>
            </div>
        </div>
    );
}
