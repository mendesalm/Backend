// scripts/popularLojas.js
import fs from "fs";
import csv from "csv-parser";
import db, { initModels } from "../models/index.js";

const popularTabelaLojas = async () => {
  const resultados = [];
  const ficheiroCSV = "./lojas_gleg.csv"; // Caminho para o seu ficheiro

  try {
    await db.sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida.");

    await initModels();
    console.log("Modelos do Sequelize inicializados com sucesso.");

    fs.createReadStream(ficheiroCSV)
      // --- CORREÇÃO APLICADA AQUI ---
      // Especifica que o separador do ficheiro CSV é um ponto e vírgula (;)
      .pipe(csv({ separator: ";" }))
      .on("data", (data) => {
        // Limpa e prepara cada linha de dados
        const linhaProcessada = {};
        for (const key in data) {
          // Garante que as chaves correspondem aos nomes dos campos no modelo
          const chaveLimpa = key.trim();
          linhaProcessada[chaveLimpa] = data[key] || null;
        }
        resultados.push(linhaProcessada);
      })
      .on("end", async () => {
        if (resultados.length === 0) {
          console.log(
            "Nenhum dado encontrado no ficheiro CSV. Verifique o ficheiro e o separador."
          );
          await db.sequelize.close();
          return;
        }

        console.log(
          `Leitura do ficheiro CSV concluída. ${resultados.length} registos encontrados.`
        );

        try {
          // Insere todos os dados na tabela de uma só vez
          await db.Loja.bulkCreate(resultados);
          console.log('Tabela "Lojas" populada com sucesso!');
        } catch (error) {
          console.error("Erro ao inserir dados no banco de dados:", error);
        } finally {
          // Fecha a conexão com o banco de dados
          await db.sequelize.close();
        }
      });
  } catch (error) {
    console.error("Falha ao conectar ou inicializar o banco de dados:", error);
  }
};

// Executa a função
popularTabelaLojas();
