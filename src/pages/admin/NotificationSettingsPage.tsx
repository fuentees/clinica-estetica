import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Mail, MessageSquare, Phone } from 'lucide-react';

export function NotificationSettingsPage() {
  const [settings, setSettings] = useState({
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: true,
    reminderTimes: {
      email: 24,
      sms: 2,
      whatsapp: 2
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('security_settings')
        .upsert({
          setting_key: 'notification_settings',
          setting_value: JSON.stringify(settings),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Configurações de Notificações</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                <span className="font-medium">Email</span>
              </div>
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  emailEnabled: e.target.checked
                }))}
                className="rounded text-blue-600"
              />
            </div>
            <Input
              type="number"
              label="Horas antes"
              value={settings.reminderTimes.email}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                reminderTimes: {
                  ...prev.reminderTimes,
                  email: parseInt(e.target.value)
                }
              }))}
              min="1"
              max="72"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-2 text-green-600" />
                <span className="font-medium">SMS</span>
              </div>
              <input
                type="checkbox"
                checked={settings.smsEnabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  smsEnabled: e.target.checked
                }))}
                className="rounded text-green-600"
              />
            </div>
            <Input
              type="number"
              label="Horas antes"
              value={settings.reminderTimes.sms}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                reminderTimes: {
                  ...prev.reminderTimes,
                  sms: parseInt(e.target.value)
                }
              }))}
              min="1"
              max="24"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
                <span className="font-medium">WhatsApp</span>
              </div>
              <input
                type="checkbox"
                checked={settings.whatsappEnabled}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  whatsappEnabled: e.target.checked
                }))}
                className="rounded text-green-600"
              />
            </div>
            <Input
              type="number"
              label="Horas antes"
              value={settings.reminderTimes.whatsapp}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                reminderTimes: {
                  ...prev.reminderTimes,
                  whatsapp: parseInt(e.target.value)
                }
              }))}
              min="1"
              max="24"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
}