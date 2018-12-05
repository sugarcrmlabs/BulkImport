<?php
$sugar_config['search_engine']['force_async_index'] = true;

$sugar_config['bulk_import_settings']['modules']['Users']['sugar_key_field'] = 'ext_key_c';
$sugar_config['bulk_import_settings']['modules']['Users']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Users']['sql_query'] = 'select id_c from users_cstm where ext_key_c = ?';
$sugar_config['bulk_import_settings']['modules']['Users']['custom_after_save']['file'] = 'custom/modules/Users/UsersBulkImport.php';
$sugar_config['bulk_import_settings']['modules']['Users']['custom_after_save']['class'] = 'UsersBulkImport';
$sugar_config['bulk_import_settings']['modules']['Accounts']['custom_before_save']['file'] = 'custom/modules/Accounts/AccountsBulkImport.php';
$sugar_config['bulk_import_settings']['modules']['Accounts']['custom_before_save']['class'] = 'AccountsBulkImport';
$sugar_config['bulk_import_settings']['modules']['Accounts']['custom_after_save']['file'] = 'custom/modules/Accounts/AccountsBulkImport.php';
$sugar_config['bulk_import_settings']['modules']['Accounts']['custom_after_save']['class'] = 'AccountsBulkImport';
$sugar_config['bulk_import_settings']['modules']['Contacts']['custom_before_save']['file'] = 'custom/modules/Contacts/ContactsBulkImport.php';
$sugar_config['bulk_import_settings']['modules']['Contacts']['custom_before_save']['class'] = 'ContactsBulkImport';
$sugar_config['bulk_import_settings']['modules']['Accounts']['sugar_key_field'] = 'ext_key_c';
$sugar_config['bulk_import_settings']['modules']['Accounts']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Accounts']['sql_query'] = 'select id_c from accounts_cstm where ext_key_c = ?';
$sugar_config['bulk_import_settings']['modules']['Contacts']['sugar_key_field'] = 'ext_key_c';
$sugar_config['bulk_import_settings']['modules']['Contacts']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Contacts']['sql_query'] = 'select id_c from contacts_cstm where ext_key_c = ?';
$sugar_config['bulk_import_settings']['relationships']['Contacts']['accounts']['external_key_field_left'] = 'left_external_key';
$sugar_config['bulk_import_settings']['relationships']['Contacts']['accounts']['external_key_field_right'] = 'right_external_key';
$sugar_config['bulk_import_settings']['modules']['Documents']['sql_query'] = 'select id_c from documents_cstm where ext_key_c = ?';
$sugar_config['bulk_import_settings']['modules']['Documents']['sugar_key_field'] = 'ext_key_c';
$sugar_config['bulk_import_settings']['modules']['Documents']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Documents']['custom_before_save']['file'] = 'custom/modules/Documents/DocumentsBulkImport.php';
$sugar_config['bulk_import_settings']['modules']['Documents']['custom_before_save']['class'] = 'DocumentsBulkImport';
$sugar_config['bulk_import_settings']['relationships']['Documents']['accounts']['external_key_field_left'] = 'left_external_key';
$sugar_config['bulk_import_settings']['relationships']['Documents']['accounts']['external_key_field_right'] = 'right_external_key';
$sugar_config['bulk_import_settings']['relationships']['Documents']['contacts']['external_key_field_left'] = 'left_external_key';
$sugar_config['bulk_import_settings']['relationships']['Documents']['contacts']['external_key_field_right'] = 'right_external_key';
$sugar_config['bulk_import_settings']['relationships']['Documents']['opportunities']['external_key_field_left'] = 'left_external_key';
$sugar_config['bulk_import_settings']['relationships']['Documents']['opportunities']['external_key_field_right'] = 'right_external_key';

