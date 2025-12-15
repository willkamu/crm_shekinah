import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase.js';

/**
 * Un Custom Hook de React que obtiene el número total de documentos 
 * en la colección 'Miembros' de Firestore.
 * @returns {number} El número total de miembros.
 */
const useMembresiaActiva = () => {
  const [totalMiembros, setTotalMiembros] = useState(0);

  useEffect(() => {
    const fetchTotalMiembros = async () => {
      try {
        const miembrosCollectionRef = collection(db, 'Miembros');
        const snapshot = await getDocs(miembrosCollectionRef);
        // La propiedad 'size' del snapshot nos da el conteo total de documentos.
        setTotalMiembros(snapshot.size);
      } catch (error) {
        console.error("Error al obtener el total de miembros:", error);
      }
    };

    fetchTotalMiembros();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente.

  return totalMiembros;
};

export default useMembresiaActiva;