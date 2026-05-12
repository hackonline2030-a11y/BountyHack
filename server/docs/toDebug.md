# Dépannage (Mongo / dev)

- Vérifier `DATABASE_URL` et que Mongo répond (`mongosh`, ou mongo-express sur le port 8086 en profil Docker).
- En cas d’index Mongo incohérent, inspecter la collection et les index avec `mongosh` ; ajuster selon les schémas Mongoose des modules actifs (users, etc.).

# Document rendering (report PDF)

- Align HTML preview (dashboard iframe) and Puppeteer print output: same print media rules, dimensions, and pagination constraints for consistent A4 PDFs.