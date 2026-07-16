import Swal from "sweetalert2"

/**
 * Utility SweetAlert2 yang dikustomisasi dengan tema Tailwind aplikasi
 */
export const showAlert = {
  success: (title: string, text: string) => {
    return Swal.fire({
      title,
      text,
      icon: "success",
      confirmButtonText: "Tutup",
      buttonsStyling: false,
      customClass: {
        popup: "bg-card text-card-foreground rounded-2xl border border-border",
        title: "text-foreground font-bold",
        htmlContainer: "text-muted-foreground",
        confirmButton: "bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium w-full mt-4 transition-colors",
      }
    })
  },
  error: (title: string, text: string) => {
    return Swal.fire({
      title,
      text,
      icon: "error",
      confirmButtonText: "Coba Lagi",
      buttonsStyling: false,
      customClass: {
        popup: "bg-card text-card-foreground rounded-2xl border border-border",
        title: "text-foreground font-bold",
        htmlContainer: "text-muted-foreground",
        confirmButton: "bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-lg font-medium w-full mt-4 transition-colors",
      }
    })
  },
}
