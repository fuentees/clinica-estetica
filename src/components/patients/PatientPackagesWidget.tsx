import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, AlertCircle, Loader2 } from 'lucide-react';

interface PatientPackage {
    id: string;
    title: string;
    total_sessions: number;
    used_sessions: number;
    status: string;
}

export function PatientPackagesWidget({ patientId }: { patientId: string }) {
    const [packages, setPackages] = useState<PatientPackage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (patientId) fetchPackages();
    }, [patientId]);

    async function fetchPackages() {
        try {
            const { data } = await supabase
                .from('patient_packages')
                .select('*')
                .eq('patient_id', patientId)
                .eq('status', 'active'); // Busca apenas ativos

            if (data) setPackages(data);
        } catch (error) {
            console.error("Erro ao buscar pacotes:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-pink-600"/></div>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
                    <Package size={24} />
                </div>
                <span className="text-xs font-bold uppercase text-gray-400">Pacotes Ativos</span>
            </div>

            {packages.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                    <AlertCircle size={32} className="mx-auto mb-2 opacity-50"/>
                    <p className="text-sm">Nenhum pacote ativo.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {packages.map(pkg => {
                        const progress = (pkg.used_sessions / pkg.total_sessions) * 100;
                        const remaining = pkg.total_sessions - pkg.used_sessions;

                        return (
                            <div key={pkg.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-gray-800 dark:text-white text-sm">{pkg.title}</h4>
                                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                        Resta: {remaining}
                                    </span>
                                </div>
                                
                                {/* Barra de Progresso */}
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                                    <div 
                                        className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-500">
                                    <span>{pkg.used_sessions} utilizados</span>
                                    <span>Total: {pkg.total_sessions}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}