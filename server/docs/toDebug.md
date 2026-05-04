# Dépannage (Mongo / dev)

- Vérifier `DATABASE_URL` et que Mongo répond (`mongosh`, ou mongo-express sur le port 8086 en profil Docker).
- En cas d’index Mongo incohérent, inspecter la collection et les index avec `mongosh` ; ajuster selon les schémas Mongoose des modules actifs (users, etc.).

# CV module

- Bug à traiter plus tard : incohérence entre aperçu HTML (dashboard/iframe) et PDF généré (Puppeteer print) sur le template `red-curb`.
- Symptôme principal : `"(en cours)"` reste sur la même ligne en aperçu mais passe à la ligne en PDF, ce qui provoque une coupe en bas avec la contrainte 1 page A4 (`297mm` max).
- Piste retenue : aligner strictement rendu preview et rendu print (mêmes media rules, mêmes dimensions et mêmes contraintes de pagination).