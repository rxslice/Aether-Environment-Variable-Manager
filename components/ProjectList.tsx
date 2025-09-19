import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onProfileChange: (projectId: string, profileId: string) => void;
  onAddProject: (name: string) => void;
  onRenameProject: (id: string, newName: string) => void;
  onDeleteProject: (id: string) => void;
  onAddProfile: (projectId: string, newProfileName: string) => void;
  onRenameProfile: (projectId: string, profileId: string, newName: string) => void;
  onDeleteProfile: (projectId: string, profileId: string) => void;
}

const ProjectCard: React.FC<{
  project: Project;
  isSelected: boolean;
  onSelect: () => void;
  onProfileChange: (profileId:string) => void;
  onRenameProject: (newName: string) => void;
  onDelete: () => void;
  onAddProfile: (newProfileName: string) => void;
  onRenameProfile: (profileId: string, newName: string) => void;
  onDeleteProfile: (profileId: string) => void;
}> = (props) => {
  const { project, isSelected, onSelect, onProfileChange, onRenameProject, onDelete, onAddProfile, onRenameProfile, onDeleteProfile } = props;
  
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [projectName, setProjectName] = useState(project.name);
  const [editingProfileId, setEditingProfileId] = useState<string|null>(null);
  const [profileName, setProfileName] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (editingProfileId && profileInputRef.current) {
        profileInputRef.current.focus();
        profileInputRef.current.select();
    }
  }, [editingProfileId]);


  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
    }
  };

  const handleNameDoubleClick = () => {
    if (isSelected) {
        setIsEditingName(true);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  };
  
  const handleNameBlur = () => {
    if (projectName.trim() && projectName.trim() !== project.name) {
        onRenameProject(projectName.trim());
    } else {
        setProjectName(project.name);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleNameBlur();
    } else if (e.key === 'Escape') {
        setProjectName(project.name);
        setIsEditingName(false);
    }
  };
  
  const handleAddProfile = () => {
    const newProfileName = prompt("Enter new profile name (e.g., staging, qa):");
    if (newProfileName) {
      onAddProfile(newProfileName);
    }
  };

  const handleProfileDoubleClick = (profileId: string, currentName: string) => {
    setEditingProfileId(profileId);
    setProfileName(currentName);
  }

  const handleProfileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileName(e.target.value);
  }

  const handleProfileNameBlur = () => {
    if (editingProfileId && profileName.trim()) {
      onRenameProfile(editingProfileId, profileName.trim());
    }
    setEditingProfileId(null);
    setProfileName('');
  }

  const handleProfileNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleProfileNameBlur();
    } else if (e.key === 'Escape') {
      setEditingProfileId(null);
      setProfileName('');
    }
  }


  return (
    <div
      onClick={onSelect}
      onMouseLeave={() => setConfirmDelete(false)}
      className={`group relative bg-[#2a313c] p-4 rounded-lg cursor-pointer transition-all duration-300 border border-transparent ${isSelected ? 'border-[#FFC400]/80 shadow-[0_0_20px_0px_rgba(255,196,0,0.3)]' : 'hover:bg-[#313945]'}`}
    >
      {isEditingName ? (
        <input
            ref={nameInputRef}
            value={projectName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="font-bold text-lg text-[#F4F2ED] bg-transparent outline-none w-full border-b border-[#FFC400]/50"
        />
      ) : (
        <h3 onDoubleClick={handleNameDoubleClick} className="font-bold text-lg text-[#F4F2ED] truncate pr-8" title="Double-click to rename">{project.name}</h3>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {project.profiles.map(profile => (
          <div key={profile.id} className="relative group/profile">
            {editingProfileId === profile.id ? (
              <input
                ref={profileInputRef}
                value={profileName}
                onChange={handleProfileNameChange}
                onBlur={handleProfileNameBlur}
                onKeyDown={handleProfileNameKeyDown}
                className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white text-[#222831] outline-none ring-2 ring-[#FFC400]"
                style={{ width: `${Math.max(80, profileName.length * 7 + 20)}px`}}
              />
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onProfileChange(profile.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleProfileDoubleClick(profile.id, profile.name);
                }}
                className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                  profile.id === project.activeProfileId
                    ? 'bg-[#FFC400] text-[#222831] hover:brightness-110'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                }`}
                title="Double-click to rename"
              >
                {profile.name}
              </button>
            )}
             {project.profiles.length > 1 && (
                <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete the "${profile.name}" profile?`)) {
                          onDeleteProfile(profile.id);
                      }
                    }}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover/profile:opacity-100 transition-opacity"
                    title="Delete profile"
                >
                  &times;
                </button>
            )}
          </div>
        ))}
        {isSelected && (
           <button onClick={(e) => { e.stopPropagation(); handleAddProfile(); }} className="w-6 h-6 rounded-full bg-gray-500/50 hover:bg-gray-500 text-gray-200 flex items-center justify-center" title="Add new profile">
            <PlusIcon className="w-4 h-4" />
           </button>
        )}
      </div>
       <button
        title="Delete Project"
        onClick={handleDeleteClick}
        className={`absolute top-3 right-3 p-1 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-80 hover:!opacity-100 ${
            confirmDelete ? 'bg-red-500/80 text-white' : 'hover:bg-gray-500/50 text-gray-400 hover:text-white'
        }`}
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

const NewProjectForm: React.FC<{
    onAddProject: (name: string) => void;
    onDone: () => void;
}> = ({ onAddProject, onDone }) => {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAddProject(name.trim());
            setName('');
            onDone();
        }
    };
    
    return (
         <form onSubmit={handleSubmit} className="mb-3">
            <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={onDone}
                placeholder="New Project Name..."
                className="w-full bg-[#313945] text-white px-3 py-2 rounded-md outline-none focus:ring-2 focus:ring-[#FFC400]"
                aria-label="New project name"
            />
        </form>
    )
}


export default function ProjectList({ projects, selectedProjectId, onSelectProject, onProfileChange, onAddProject, onRenameProject, onDeleteProject, onAddProfile, onRenameProfile, onDeleteProfile }: ProjectListProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1 mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-[#F4F2ED]">Projects</h2>
        <button 
            onClick={() => setIsAdding(true)}
            className="p-1 rounded-full text-gray-400 hover:bg-[#313945] hover:text-white transition-colors"
            title="Add new project"
        >
            <PlusIcon className="w-6 h-6" />
        </button>
      </div>

      {isAdding && <NewProjectForm onAddProject={onAddProject} onDone={() => setIsAdding(false)} />}
      
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          isSelected={project.id === selectedProjectId}
          onSelect={() => onSelectProject(project.id)}
          onProfileChange={(profileId) => onProfileChange(project.id, profileId)}
          onRenameProject={(newName) => onRenameProject(project.id, newName)}
          onDelete={() => onDeleteProject(project.id)}
          onAddProfile={(newProfileName) => onAddProfile(project.id, newProfileName)}
          onRenameProfile={(profileId, newName) => onRenameProfile(project.id, profileId, newName)}
          onDeleteProfile={(profileId) => onDeleteProfile(project.id, profileId)}
        />
      ))}
    </div>
  );
}