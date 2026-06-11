import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteConfig, useUpdateSiteConfig } from "@/hooks/queries/useSiteConfig";
import { Phone, Mail, MapPin, Facebook, MessageCircle, Send, Globe } from "lucide-react";

const ContactPage = () => {
  const { data, isLoading } = useSiteConfig();
  const updateConfig = useUpdateSiteConfig();

  const [form, setForm] = useState({
    phone: "",
    email: "",
    address: "",
    facebook: "",
    zalo: "",
    telegram: "",
    messenger: "",
    discord: "",
  });

  useEffect(() => {
    if (data?.data?.contact) {
      setForm(data.data.contact);
    }
  }, [data]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateConfig.mutate({ contact: form });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const fields = [
    { key: "phone", label: "Số điện thoại", icon: Phone, placeholder: "0123.456.789" },
    { key: "email", label: "Email", icon: Mail, placeholder: "support@example.com" },
    { key: "address", label: "Địa chỉ", icon: MapPin, placeholder: "123 Đường ABC, Quận XYZ" },
    { key: "facebook", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/..." },
    { key: "zalo", label: "Zalo", icon: MessageCircle, placeholder: "https://zalo.me/..." },
    { key: "telegram", label: "Telegram", icon: Send, placeholder: "https://t.me/..." },
    { key: "messenger", label: "Messenger", icon: MessageCircle, placeholder: "https://m.me/..." },
    { key: "discord", label: "Discord", icon: Globe, placeholder: "https://discord.gg/..." },
  ];

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Phone className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Thông tin liên hệ</h3>
            <p className="text-sm text-muted-foreground">
              Quản lý số điện thoại, email, địa chỉ và mạng xã hội
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateConfig.isPending}
          className="bg-gradient-brand text-white hover:bg-gradient-brand-hover"
        >
          {updateConfig.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key}>
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Icon className="size-3.5" />
              {label}
            </Label>
            <Input
              value={form[key as keyof typeof form]}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="mt-1.5"
            />
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default ContactPage;
