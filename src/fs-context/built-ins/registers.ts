import type { ExtensionRegister, Just } from "@framework/internal";
export const TurboWarp: ExtensionRegister = (metadata, scratch) => {
    scratch.extensions.register(metadata.objectGenerated);
};
export const GandiIDE: ExtensionRegister = (metadata) => {
    window.tempExt = {
        Extension: metadata.constructors.generated,
        info: {
            extensionId: metadata.objectPlain.id,
            name: metadata.objectPlain.displayName,
            description: metadata.objectPlain.description,
            featured: true,
            disabled: false,
            collaboratorList: metadata.objectPlain.collaborators
        }
    };
};