import React, { useState, useMemo, useEffect } from 'react';
import { Project, VariableType, EnvironmentVariable, Profile } from './types';
import Header from './components/Header';
import ProjectList from './components/ProjectList';
import EnvironmentCanvas from './components/EnvironmentCanvas';
import { ProjectIcon } from './components/Icons';

// Mock Data
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Aether Frontend',
    activeProfileId: 'prof-1-dev',
    profiles: [
      {
        id: 'prof-1-dev',
        name: 'development',
        variables: [
          { id: 'var-1', key: 'VITE_API_URL', value: 'http://localhost:3000/api', isSecret: false, type: VariableType.URL },
          { id: 'var-2', key: 'VITE_STRIPE_PUBLIC_KEY', value: 'pk_test_51H...abc', isSecret: true, type: VariableType.GENERIC_SECRET },
          { id: 'var-3', key: 'VITE_ADMIN_EMAIL', value: 'admin@aether.app', isSecret: false, type: VariableType.EMAIL },
        ],
      },
      {
        id: 'prof-1-prod',
        name: 'production',
        variables: [
          { id: 'var-4', key: 'VITE_API_URL', value: 'https://aether.app/api', isSecret: false, type: VariableType.URL },
          { id: 'var-5', key: 'VITE_STRIPE_PUBLIC_KEY', value: 'pk_live_51H...xyz', isSecret: true, type: VariableType.GENERIC_SECRET },
        ],
      },
    ],
  },
  {
    id: 'proj-2',
    name: 'Zephyr API',
    activeProfileId: 'prof-2-dev',
    profiles: [
      {
        id: 'prof-2-dev',
        name: 'development',
        variables: [
          { id: 'var-6', key: 'DATABASE_URL', value: 'postgresql://user:pass@localhost:5432/zephyr', isSecret: true, type: VariableType.URL },
          { id: 'var-7', key: 'JWT_SECRET', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c', isSecret: true, type: VariableType.JWT },
          { id: 'var-8', key: 'AWS_ACCESS_KEY_ID', value: 'AKIAIOSFODNN7EXAMPLE', isSecret: true, type: VariableType.AWS_KEY },
        ],
      },
       {
        id: 'prof-2-staging',
        name: 'staging',
        variables: [
          { id: 'var-9', key: 'DATABASE_URL', value: 'postgresql://user:pass@staging-db:5432/zephyr', isSecret: true, type: VariableType.URL },
        ],
      },
    ],
  },
];

const initialProjects = (() => {
  try {
    const savedData = localStorage.getItem('aether-projects');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        return parsedData;
      }
    }
  } catch (error) {
    console.error("Failed to load or parse projects from localStorage", error);
  }
  return INITIAL_PROJECTS;
})();


export default function App() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjects[0]?.id || null);
  const [focusedVarId, setFocusedVarId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('aether-projects', JSON.stringify(projects));
    } catch (error) {
      console.error("Failed to save projects to localStorage", error);
    }
  }, [projects]);

  useEffect(() => {
    const projectExists = projects.some(p => p.id === selectedProjectId);
    if (!projectExists) {
      setSelectedProjectId(projects[0]?.id || null);
    }
  }, [projects, selectedProjectId]);

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const activeProfile = useMemo(() => {
    return selectedProject?.profiles.find(p => p.id === selectedProject.activeProfileId) || null;
  }, [selectedProject]);
  
  const handleProfileChange = (projectId: string, profileId: string) => {
    setProjects(prevProjects => 
      prevProjects.map(p => 
        p.id === projectId ? { ...p, activeProfileId: profileId } : p
      )
    );
  };

  const handleVariableChange = (profileId: string, varId: string, updatedVar: Partial<Omit<EnvironmentVariable, 'id'>>) => {
    setProjects(prevProjects => 
      prevProjects.map(p => {
        if (p.id !== selectedProjectId) return p;
        return {
          ...p,
          profiles: p.profiles.map(prof => {
            if (prof.id !== profileId) return prof;
            return {
              ...prof,
              variables: prof.variables.map(v => 
                v.id === varId ? { ...v, ...updatedVar } : v
              )
            }
          })
        }
      })
    );
  };

  const handleAddVariable = (profileId: string) => {
     const newVarId = `var-${Date.now()}`;
     setProjects(prevProjects => 
      prevProjects.map(p => {
        if (p.id !== selectedProjectId) return p;
        return {
          ...p,
          profiles: p.profiles.map(prof => {
            if (prof.id !== profileId) return prof;
            return {
              ...prof,
              variables: [...prof.variables, { id: newVarId, key: '', value: '', isSecret: false, type: VariableType.TEXT }]
            }
          })
        }
      })
    );
    setFocusedVarId(newVarId);
  }

  const handleDeleteVariable = (profileId: string, varId: string) => {
    setProjects(prevProjects => 
      prevProjects.map(p => {
        if (p.id !== selectedProjectId) return p;
        return {
          ...p,
          profiles: p.profiles.map(prof => {
            if (prof.id !== profileId) return prof;
            return {
              ...prof,
              variables: prof.variables.filter(v => v.id !== varId)
            }
          })
        }
      })
    );
  };
  
  const handleAddProject = (projectName: string) => {
    const newProjectId = `proj-${Date.now()}`;
    const newProfileId = `prof-${Date.now()}-dev`;
    const newProject: Project = {
      id: newProjectId,
      name: projectName,
      activeProfileId: newProfileId,
      profiles: [
        {
          id: newProfileId,
          name: 'development',
          variables: []
        }
      ]
    };
    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProjectId);
  };
  
  const handleRenameProject = (projectId: string, newName: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const handleAddProfile = (projectId: string, newProfileName: string) => {
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.id !== projectId) return p;
      const activeProfile = p.profiles.find(prof => prof.id === p.activeProfileId);
      if (!activeProfile) return p; // Should not happen

      const newProfileId = `prof-${Date.now()}`;
      const newProfile: Profile = {
        id: newProfileId,
        name: newProfileName,
        // Clone variables from active profile, but give them new IDs
        variables: activeProfile.variables.map(v => ({...v, id: `var-${Date.now()}-${Math.random()}`}))
      };
      return { ...p, profiles: [...p.profiles, newProfile], activeProfileId: newProfileId };
    }));
  };

  const handleRenameProfile = (projectId: string, profileId: string, newName: string) => {
     setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        return {
            ...p,
            profiles: p.profiles.map(prof => prof.id === profileId ? { ...prof, name: newName } : prof)
        }
     }));
  };

  const handleDeleteProfile = (projectId: string, profileId: string) => {
    setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p;

        // Prevent deleting the last profile
        if (p.profiles.length <= 1) return p;
        
        const newProfiles = p.profiles.filter(prof => prof.id !== profileId);
        const newActiveProfileId = p.activeProfileId === profileId ? newProfiles[0].id : p.activeProfileId;
        
        return { ...p, profiles: newProfiles, activeProfileId: newActiveProfileId };
    }));
  };

  const handleImportVariables = (profileId: string, importedVars: {key: string, value: string}[]) => {
     setProjects(prevProjects => 
      prevProjects.map(p => {
        if (p.id !== selectedProjectId) return p;
        return {
          ...p,
          profiles: p.profiles.map(prof => {
            if (prof.id !== profileId) return prof;

            const existingVarsMap = new Map(prof.variables.map(v => [v.key, v]));
            
            importedVars.forEach(importedVar => {
              if (existingVarsMap.has(importedVar.key)) {
                // Update existing var
                const existing = existingVarsMap.get(importedVar.key)!;
                existing.value = importedVar.value;
              } else {
                // Add new var
                const newVar = {
                  id: `var-${Date.now()}-${Math.random()}`,
                  key: importedVar.key,
                  value: importedVar.value,
                  isSecret: false,
                  type: VariableType.TEXT
                };
                existingVarsMap.set(importedVar.key, newVar);
              }
            });

            return {
              ...prof,
              variables: Array.from(existingVarsMap.values())
            }
          })
        }
      })
    );
  };


  const handleFocusComplete = () => {
    setFocusedVarId(null);
  }

  return (
    <div 
      className="min-h-screen text-[#F4F2ED] p-4 sm:p-6 lg:p-8 relative"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <Header />
        <main className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          <aside className="md:col-span-4 lg:col-span-3">
            <ProjectList 
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onProfileChange={handleProfileChange}
              onAddProject={handleAddProject}
              onRenameProject={handleRenameProject}
              onDeleteProject={handleDeleteProject}
              onAddProfile={handleAddProfile}
              onRenameProfile={handleRenameProfile}
              onDeleteProfile={handleDeleteProfile}
            />
          </aside>
          <section className="md:col-span-8 lg:col-span-9">
            {activeProfile && selectedProject ? (
              <EnvironmentCanvas 
                key={activeProfile.id}
                project={selectedProject}
                profile={activeProfile} 
                onVariableChange={handleVariableChange}
                onAddVariable={handleAddVariable}
                onDeleteVariable={handleDeleteVariable}
                onImportVariables={handleImportVariables}
                focusedVarId={focusedVarId}
                onFocusComplete={handleFocusComplete}
              />
            ) : (
              <div className="bg-[#F4F2ED]/80 backdrop-blur-sm border border-white/20 text-[#222831] rounded-xl p-8 h-full flex items-center justify-center shadow-2xl"
                style={{
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1), inset 0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <div className="text-center">
                  <ProjectIcon className="w-16 h-16 mx-auto text-gray-400" />
                  <p className="text-xl font-medium mt-4">Select a project to view its variables.</p>
                  <p className="text-gray-500 mt-1">You can add and manage projects from the sidebar.</p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}