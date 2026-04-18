from django.contrib.admin import AdminSite


class GaleriAdminSite(AdminSite):
    site_header = "🎨 Sanat Galerisi Yönetim Paneli"
    site_title = "Sanat Galerisi Admin"
    index_title = "Yönetim Paneli"
    site_url = "http://localhost:5173"
