"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { User, Mail, Shield, Calendar, Save } from "lucide-react"
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Badge } from "@/components/ui"
import { showAlert } from "@/lib/swal"

interface ProfileClientProps {
  initialProfile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: string
    created_at: string
  }
  initialEmail: string
}

export function ProfileClient({ initialProfile, initialEmail }: ProfileClientProps) {
  const router = useRouter()
  const supabase = createClient() as any

  const [isSaving, setIsSaving] = useState(false)
  const [fullName, setFullName] = useState(initialProfile.full_name || "")

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      showAlert.error("Validasi Gagal", "Nama Lengkap tidak boleh kosong.")
      return
    }

    try {
      setIsSaving(true)

      // 1. Update data di tabel public.users
      const { error: dbError } = await supabase
        .from("users")
        .update({ full_name: fullName.trim() })
        .eq("id", initialProfile.id)

      if (dbError) throw dbError

      // 2. Update user metadata di Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim() }
      })

      if (authError) throw authError

      showAlert.success("Profil Diperbarui", "Nama lengkap Anda berhasil disimpan.")
      
      // Refresh router untuk memicu pembaruan nama di TopNavbar layout
      router.refresh()
    } catch (err: any) {
      console.error("Error updating profile:", err)
      showAlert.error("Pembaruan Gagal", err.message || "Gagal memperbarui profil Anda.")
    } finally {
      setIsSaving(false)
    }
  }

  // Format tanggal bergabung (Locale Indonesia)
  const formattedJoinedDate = initialProfile.created_at
    ? new Date(initialProfile.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-"

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profil Saya</h1>
        <p className="text-muted-foreground text-sm">
          Kelola informasi profil pribadi Anda di bawah ini.
        </p>
      </div>

      <Card className="border-border/50 shadow-md">
        <form onSubmit={handleSave}>
          <CardHeader className="border-b border-border/40 pb-6 flex flex-row items-center gap-5">
            {/* Avatar Lingkaran */}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-2xl uppercase">
              {fullName ? fullName.slice(0, 2) : "US"}
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl font-semibold">{fullName || "User"}</CardTitle>
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Shield className="h-3 w-3 text-muted-foreground" /> Role:{" "}
                <Badge variant={initialProfile.role === "admin" ? "default" : "secondary"} className="capitalize">
                  {initialProfile.role}
                </Badge>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-6">
            {/* Input Nama Lengkap */}
            <Input
              id="fullName"
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap Anda"
              leftIcon={<User className="h-4 w-4" />}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSaving}
              required
            />

            {/* Input Email (Disabled) */}
            <Input
              id="email"
              label="Alamat Email"
              type="email"
              leftIcon={<Mail className="h-4 w-4" />}
              value={initialEmail}
              disabled
              title="Email tidak dapat diubah"
            />

            {/* Tanggal Bergabung */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border/40 bg-muted/20 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Bergabung sejak: {formattedJoinedDate}</span>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border/40 pt-6 flex justify-end">
            <Button type="submit" isLoading={isSaving} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
