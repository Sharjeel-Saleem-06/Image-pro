import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, Eye, Server, UserCheck } from 'lucide-react';

const PrivacyPolicy = () => {
    const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <Layout>
            <div className="min-h-screen pt-20 pb-12 px-4 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Last Updated: {lastUpdated}
                        </p>
                    </div>

                    <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-0 shadow-lg mb-8">
                        <CardContent className="p-8 space-y-8">
                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold">1. Local Processing Commitment</h2>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-14">
                                    At ImagePro, we prioritize your privacy above all else. Unlike traditional image processing services,
                                    <strong> we do not upload your images to any server</strong> for processing. All operations—including conversion,
                                    editing, OCR, and AI enhancement—are performed entirely locally within your browser using advanced WebAssembly
                                    and client-side technologies. Your images never leave your device.
                                </p>
                            </section>

                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Server className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold">2. Data Storage</h2>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-14">
                                    Any data you save, such as user preferences, theme settings, or project history, is stored securely in your
                                    browser's local storage or IndexedDB. We do not maintain a central database of your content. You have full control
                                    over this data and can clear it at any time through your browser settings.
                                </p>
                            </section>

                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <Lock className="w-6 h-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold">3. Authentication Data</h2>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-14">
                                    For authentication, we use Supabase alongside Google OAuth and Magic Links. We only collect the minimal information
                                    necessary to identify your account (such as your email address and name). This data is encrypted and securely stored
                                    by our authentication provider, Supabase, which adheres to strict industry security standards. We do not sell or share
                                    your personal information with third parties.
                                </p>
                            </section>

                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                        <Eye className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold">4. Third-Party Services</h2>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-14">
                                    While our core processing is local, we use trusted third-party services for specific non-image functionalities:
                                    <ul className="list-disc mt-2 space-y-1 ml-5">
                                        <li><strong>Google OAuth:</strong> For secure sign-in.</li>
                                        <li><strong>Supabase:</strong> For authentication and user profile management.</li>
                                        <li><strong>Netlify:</strong> For hosting the application static assets.</li>
                                    </ul>
                                </p>
                            </section>

                            <section>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                        <UserCheck className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <h2 className="text-2xl font-semibold">5. Your Rights</h2>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed pl-14">
                                    You have the right to access, update, or delete your account information at any time. Since image data is not stored
                                    on our servers, there is no image data for us to delete—it remains solely on your device. For account deletion requests,
                                    please contact us via the support channels provided in the app.
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default PrivacyPolicy;
