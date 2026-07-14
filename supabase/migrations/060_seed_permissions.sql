-- ============================================================================
-- EDEN: Luxury Management — Migration 060 : Seed Permissions
-- ============================================================================
-- Insère les permissions système validées par le CTO.
-- Aucun hôtel, aucun utilisateur, aucune donnée mock.
-- ============================================================================

INSERT INTO permissions (code, name, group_name) VALUES
    ('booking.create',        'Créer une réservation',          'Booking'),
    ('booking.cancel',        'Annuler une réservation',        'Booking'),
    ('booking.modify',        'Modifier une réservation',       'Booking'),
    ('booking.force_checkout', 'Forcer un check-out avec solde', 'Booking'),
    ('payment.create',        'Créer un paiement',              'Payment'),
    ('payment.refund',        'Effectuer un remboursement',     'Payment'),
    ('room.manage',           'Gérer les chambres',             'Room'),
    ('room.maintenance',      'Mettre en maintenance',          'Room'),
    ('employee.manage',       'Gérer le personnel',             'Employee'),
    ('guest.manage',          'Gérer les clients',              'Guest'),
    ('settings.update',       'Modifier les paramètres',        'Settings'),
    ('invoice.generate',      'Générer des factures',           'Invoice'),
    ('report.view',           'Consulter les rapports',         'Report'),
    ('audit.view',            'Consulter les logs d''audit',    'Audit')
ON CONFLICT (code) DO NOTHING;
