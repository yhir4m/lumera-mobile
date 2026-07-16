import React, { createContext, useContext, useState, useEffect } from 'react';
import { Core } from '../interfaces/CoreInterfaces';
import { coreService } from '../services/CoreServices/CoreService';

export type LoginPage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface RanchoContextType {
  selectedOrgId: string;
  setSelectedOrgId: (id: string) => void;
  organizations: Core.Organization[];
  setOrganizations: (orgs: Core.Organization[]) => void;
  phone: string;
  setPhone: (phone: string) => void;
  password: string;
  setPassword: (password: string) => void;
  loginPage: LoginPage;
  setLoginPage: React.Dispatch<React.SetStateAction<LoginPage>>;
  loginPageHistory: LoginPage[];
  setLoginPageHistory: React.Dispatch<React.SetStateAction<LoginPage[]>>;

  // Production Unit States
  selectedProductionUnitId: string;
  setSelectedProductionUnitId: React.Dispatch<React.SetStateAction<string>>;
  productionUnits: Core.ProductionUnit[];
  setProductionUnits: React.Dispatch<React.SetStateAction<Core.ProductionUnit[]>>;
  productionUnitsByOrg: Record<string, Core.ProductionUnit[]>;
  loadingProductionUnits: boolean;
  productionUnitsError: string;
  productionUnitsBlocked: boolean;
  loadProductionUnits: (orgId: string, force?: boolean) => Promise<void>;

  // Animal States
  animals: Core.Animal[];
  setAnimals: React.Dispatch<React.SetStateAction<Core.Animal[]>>;
  loadingAnimals: boolean;
  animalsError: string;
  loadAnimals: (orgId: string, puId: string, force?: boolean) => Promise<void>;

  moveAnimal: (
    animal: Core.Animal,
    fromOrgId: string,
    fromPuId: string,
    toOrgId: string,
    toPuId: string
  ) => Promise<void>;
  animalToMove: Core.Animal | null;
  setAnimalToMove: React.Dispatch<React.SetStateAction<Core.Animal | null>>;
}


const RanchoContext = createContext<RanchoContextType | undefined>(undefined);

export const useRancho = () => {
  const context = useContext(RanchoContext);
  if (!context) {
    throw new Error('useRancho must be used within a RanchoProvider');
  }
  return context;
};

export const RanchoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [organizations, setOrganizations] = useState<Core.Organization[]>([]);
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginPage, setLoginPage] = useState<LoginPage>(0);
  const [loginPageHistory, setLoginPageHistory] = useState<LoginPage[]>([]);

  // Production Unit States
  const [selectedProductionUnitId, setSelectedProductionUnitId] = useState<string>('');
  const [productionUnitsByOrg, setProductionUnitsByOrg] = useState<Record<string, Core.ProductionUnit[]>>({});
  const [loadingProductionUnits, setLoadingProductionUnits] = useState<boolean>(false);
  const [productionUnitsError, setProductionUnitsError] = useState<string>('');
  const [productionUnitsBlocked, setProductionUnitsBlocked] = useState<boolean>(false);

  // Animal States
  const [animalsByPU, setAnimalsByPU] = useState<Record<string, Core.Animal[]>>({});
  const [loadingAnimals, setLoadingAnimals] = useState<boolean>(false);
  const [animalsError, setAnimalsError] = useState<string>('');
  const [animalToMove, setAnimalToMove] = useState<Core.Animal | null>(null)

  // Derived states
  const productionUnits = selectedOrgId ? (productionUnitsByOrg[selectedOrgId] || []) : [];
  const setProductionUnits: React.Dispatch<React.SetStateAction<Core.ProductionUnit[]>> = (value) => {
    if (!selectedOrgId) return;
    setProductionUnitsByOrg((prev) => {
      const currentPUs = prev[selectedOrgId] || [];
      const updatedPUs = typeof value === 'function' ? (value as Function)(currentPUs) : value;
      return {
        ...prev,
        [selectedOrgId]: updatedPUs,
      };
    });
  };

  const animals = (selectedOrgId && selectedProductionUnitId) ? (animalsByPU[`${selectedOrgId}_${selectedProductionUnitId}`] || []) : [];
  const setAnimals: React.Dispatch<React.SetStateAction<Core.Animal[]>> = (value) => {
    if (!selectedOrgId || !selectedProductionUnitId) return;
    const cacheKey = `${selectedOrgId}_${selectedProductionUnitId}`;
    setAnimalsByPU((prev) => {
      const currentAnimals = prev[cacheKey] || [];
      const updatedAnimals = typeof value === 'function' ? (value as Function)(currentAnimals) : value;
      return {
        ...prev,
        [cacheKey]: updatedAnimals,
      };
    });
  };

  const loadProductionUnits = async (orgId: string, force?: boolean) => {

    if (productionUnitsByOrg[orgId] && !force) {
      return;
    }
    setLoadingProductionUnits(true);
    setProductionUnitsError('');
    setProductionUnitsBlocked(false);
    try {
      const response = await coreService.getProductionUnits(orgId);
      const data = response.data || [];
      setProductionUnitsByOrg((prev) => ({
        ...prev,
        [orgId]: data,
      }));
    } catch (err: any) {
      if (err.response?.status === 403) {
        setProductionUnitsBlocked(true);
      }
    } finally {
      setLoadingProductionUnits(false);
    }
  };

  const loadAnimals = async (orgId: string, puId: string, force?: boolean) => {
    const cacheKey = `${orgId}_${puId}`;
    if (animalsByPU[cacheKey] && !force) {
      return;
    }
    setLoadingAnimals(true);
    setAnimalsError('');
    try {
      const response = await coreService.getAnimals(orgId, puId);
      const data = response.data || [];
      setAnimalsByPU((prev) => ({
        ...prev,
        [cacheKey]: data,
      }));
    } catch (err: any) {
      setAnimalsError(err.message || 'Error al obtener los animales');
      setAnimalsByPU((prev) => ({
        ...prev,
        [cacheKey]: [],
      }));
    } finally {
      setLoadingAnimals(false);
    }
  };

  const moveAnimal = async (
    animal: Core.Animal,
    fromOrgId: string,
    fromPuId: string,
    toOrgId: string,
    toPuId: string
  ) => {
    const fromKey = `${fromOrgId}_${fromPuId}`;
    const toKey = `${toOrgId}_${toPuId}`;

    // Remove from source list
    setAnimalsByPU((prev) => {
      const fromList = prev[fromKey] || [];
      const updatedFromList = fromList.filter((a) => a.id !== animal.id);
      return {
        ...prev,
        [fromKey]: updatedFromList,
      };
    });

    // Add to target list
    if (animalsByPU[toKey]) {
      setAnimalsByPU((prev) => {
        console.log(prev, 'prev');
        const toList = prev[toKey] || [];
        const updatedToList = toList.some((a) => a.id === animal.id)
          ? toList
          : [...toList, animal];
        return {
          ...prev,
          [toKey]: updatedToList,
        };
      });
    } else {
      try {
        const response = await coreService.getAnimals(toOrgId, toPuId);
        const data = response.data || [];
        setAnimalsByPU((prev) => {
          const existingList = prev[toKey] || data;
          const updatedToList = existingList.some((a) => a.id === animal.id)
            ? existingList
            : [...existingList, animal];
          return {
            ...prev,
            [toKey]: updatedToList,
          };
        });
      } catch (err) {
        setAnimalsByPU((prev) => ({
          ...prev,
          [toKey]: [animal],
        }));
      }
    }
  };

  // Automatic loading of production units on selectedOrgId change
  useEffect(() => {
    setSelectedProductionUnitId('');
    if (selectedOrgId) {
      loadProductionUnits(selectedOrgId);
    }
  }, [selectedOrgId]);

  // Automatic loading of animals on selectedOrgId and selectedProductionUnitId changes
  useEffect(() => {
    if (selectedOrgId && selectedProductionUnitId) {
      loadAnimals(selectedOrgId, selectedProductionUnitId);
    }
  }, [selectedOrgId, selectedProductionUnitId]);

  return (
    <RanchoContext.Provider
      value={{
        selectedOrgId,
        setSelectedOrgId,
        organizations,
        setOrganizations,
        phone,
        setPhone,
        password,
        setPassword,
        loginPage,
        setLoginPage,
        loginPageHistory,
        setLoginPageHistory,
        selectedProductionUnitId,
        setSelectedProductionUnitId,
        productionUnits,
        setProductionUnits,
        productionUnitsByOrg,
        loadingProductionUnits,
        productionUnitsError,
        productionUnitsBlocked,
        loadProductionUnits,
        animals,
        setAnimals,
        loadingAnimals,
        animalsError,
        loadAnimals,
        moveAnimal,
        animalToMove,
        setAnimalToMove,
      }}
    >
      {children}
    </RanchoContext.Provider>
  );
};
