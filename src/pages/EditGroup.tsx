import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Group {
  id: string;
  name: string;
  description: string;
  admin_id: string;
}

function EditGroup() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!groupId) {
      navigate('/groups');
      return;
    }
    fetchGroup();
  }, [user, groupId, navigate]);

  const fetchGroup = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, description, admin_id')
        .eq('id', groupId!)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          variant: "destructive",
          title: "Grupp inte hittad",
          description: "Gruppen finns inte eller har tagits bort"
        });
        navigate('/groups');
        return;
      }

      if (data.admin_id !== user!.id) {
        toast({
          variant: "destructive",
          title: "Åtkomst nekad",
          description: "Du kan bara redigera grupper som du har skapat"
        });
        navigate('/groups');
        return;
      }

      setGroup(data);
      setFormData({
        name: data.name,
        description: data.description || ''
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte ladda grupp",
        description: error.message
      });
      navigate('/groups');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Gruppnamn krävs",
        description: "Ange ett namn för gruppen"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: formData.name,
          description: formData.description
        })
        .eq('id', groupId!);

      if (error) throw error;

      toast({
        title: "Grupp uppdaterad!",
        description: `${formData.name} har uppdaterats framgångsrikt.`
      });

      navigate('/groups');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Kunde inte uppdatera grupp",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!group) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-8">
        <div className="max-w-md mx-auto">
          <p className="text-center text-muted-foreground">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="glass"
            onClick={() => navigate('/groups')}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            Redigera Grupp
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Group Info */}
          <Card className="p-6 glass card-shadow">
            <h2 className="text-lg font-semibold mb-4">Gruppinformation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Gruppnamn</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="t.ex. KTH Crew"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Beskrivning (valfritt)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beskriv er grupp..."
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full gradient-primary text-white button-shadow h-12"
            disabled={loading}
          >
            <Save size={18} className="mr-2" />
            {loading ? 'Sparar ändringar...' : 'Spara ändringar'}
          </Button>

        </form>
      </div>
    </div>
  );
}

export default EditGroup;