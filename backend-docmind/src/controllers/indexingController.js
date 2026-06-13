import IndexSnapshot from '../models/IndexSnapshot.js';
import IngestionDocument from '../models/IngestionDocument.js';
import path from 'path';
import fs from 'fs';

/**
 * @route   POST /api/indexes/rebuild/
 * @desc    Rebuild search index
 * @access  Private (SUPER_ADMIN or IT_ADMIN)
 */
export const rebuildIndex = async (req, res, next) => {
    try {
        const { modality, mode, notes } = req.body;

        // Validate input
        if (!modality || !['text', 'image', 'audio'].includes(modality)) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Modality must be one of: text, image, audio'
                }
            });
        }

        const rebuildMode = mode || 'full';
        if (!['full', 'incremental'].includes(rebuildMode)) {
            return res.status(400).json({
                status: 400,
                data: {
                    detail: 'Mode must be either full or incremental'
                }
            });
        }

        // Deactivate previous active snapshot for this modality
        await IndexSnapshot.updateMany(
            { modality, is_active: true },
            { is_active: false }
        );

        // Count documents by modality
        let docCount = 0;
        if (modality === 'text') {
            docCount = await IngestionDocument.countDocuments({
                status: 'READY',
                file_type: { $in: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] }
            });
        } else if (modality === 'image') {
            docCount = await IngestionDocument.countDocuments({
                status: 'READY',
                file_type: { $regex: /^image\// }
            });
        } else if (modality === 'audio') {
            docCount = await IngestionDocument.countDocuments({
                status: 'READY',
                file_type: { $regex: /^audio\// }
            });
        }

        // Generate version
        const version = `v${Date.now()}`;

        // Create index paths (in production, these would be actual index files)
        const indexDir = './indexes';
        if (!fs.existsSync(indexDir)) {
            fs.mkdirSync(indexDir, { recursive: true });
        }

        const indexPath = path.join(indexDir, `${modality}_${version}.index`);
        const idMappingPath = path.join(indexDir, `${modality}_${version}_mapping.json`);

        // Create placeholder index files
        fs.writeFileSync(indexPath, `Index for ${modality} - ${version}`);
        fs.writeFileSync(idMappingPath, JSON.stringify({ version, modality, doc_count: docCount }));

        // Create snapshot
        const snapshot = await IndexSnapshot.create({
            name: `${modality.charAt(0).toUpperCase() + modality.slice(1)} Index ${version}`,
            modality,
            version,
            index_path: indexPath,
            id_mapping_path: idMappingPath,
            doc_count: docCount,
            is_active: true,
            built_by: req.user._id,
            notes: notes || `${rebuildMode} rebuild`
        });

        await snapshot.populate('built_by', 'username email');

        res.status(201).json({
            message: `Index rebuilt successfully for ${modality} modality`,
            snapshot: {
                id: snapshot._id,
                name: snapshot.name,
                modality: snapshot.modality,
                version: snapshot.version,
                index_path: snapshot.index_path,
                id_mapping_path: snapshot.id_mapping_path,
                doc_count: snapshot.doc_count,
                is_active: snapshot.is_active,
                built_at: snapshot.built_at,
                built_by: snapshot.built_by,
                notes: snapshot.notes
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/indexes/snapshots/
 * @desc    List index snapshots
 * @access  Private
 */
export const listSnapshots = async (req, res, next) => {
    try {
        const { modality } = req.query;

        const filter = {};
        if (modality) {
            if (!['text', 'image', 'audio'].includes(modality)) {
                return res.status(400).json({
                    status: 400,
                    data: {
                        detail: 'Invalid modality. Must be one of: text, image, audio'
                    }
                });
            }
            filter.modality = modality;
        }

        const snapshots = await IndexSnapshot.find(filter)
            .sort({ built_at: -1 })
            .populate('built_by', 'username email');

        res.json(snapshots);
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/indexes/snapshots/:id/activate/
 * @desc    Activate a snapshot
 * @access  Private (SUPER_ADMIN or IT_ADMIN)
 */
export const activateSnapshot = async (req, res, next) => {
    try {
        const snapshot = await IndexSnapshot.findById(req.params.id);

        if (!snapshot) {
            return res.status(404).json({
                status: 404,
                data: {
                    detail: 'Snapshot not found'
                }
            });
        }

        // Deactivate all other snapshots for this modality
        await IndexSnapshot.updateMany(
            { modality: snapshot.modality, is_active: true },
            { is_active: false }
        );

        // Activate this snapshot
        snapshot.is_active = true;
        await snapshot.save();

        res.json({
            message: 'Snapshot activated successfully',
            snapshot
        });
    } catch (error) {
        next(error);
    }
};
