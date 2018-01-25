## Tests
Tests are written for Chakram (https://github.com/dareid/chakram) / Thorn (https://github.com/sugarcrm/thorn) for the BulkImport API on a Sugar 7.9.1.0 system.<br />
Thorn can be run using docker (https://github.com/esimonetti/ThornDockerized). The test can be run by specifying the single filename, or alternatively by folder.
As an example `docker run -v ${PWD}/samples:/tests -t -i thorn ./runtest.sh https://myurl.com/sugar adminuser adminpass /tests/` will run every js test file contained on /tests/, while if passed a specific filename, only the file's tests will be run.<br />
Most tests are built on top of Thorn, while some other tests have been built either with Chakram or a combination of Chakram and Thorn, as Thorn alone for some scenarios would not be suitable for expected edge cases.

## Structure
Tests have been divided into two categories
* Standard
* Customfields

### Standard
Tests of the overall BulkImport API, without requiring anything more than the code provided on the repository and the config_override.php options below.
Run the tests with: `docker run -v ${PWD}/apitests:/tests -t -i thorn ./runtest.sh https://myurl.com/sugar adminuser adminpass /tests/standard/`

#### config_override.php
To run the Standard tests, the following configuration options are required:
```
$sugar_config['search_engine']['force_async_index'] = true;
$sugar_config['bulk_import_settings']['modules']['Users']['sugar_key_field'] = 'user_name';
$sugar_config['bulk_import_settings']['modules']['Users']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Users']['sql_query'] = 'select id from users where user_name = ?';
$sugar_config['bulk_import_settings']['modules']['Accounts']['custom_before_save']['file'] = 'custom/modules/Accounts/AccountsBulkImport.php';
$sugar_config['bulk_import_settings']['modules']['Accounts']['custom_before_save']['class'] = 'AccountsBulkImport';
$sugar_config['bulk_import_settings']['modules']['Accounts']['custom_before_save']['method'] = 'accountsBeforeSave';
$sugar_config['bulk_import_settings']['modules']['Contacts']['custom_before_save']['file'] = 'custom/modules/Contacts/ContactsBulkImport.php';
$sugar_config['bulk_import_settings']['modules']['Contacts']['custom_before_save']['class'] = 'ContactsBulkImport';
$sugar_config['bulk_import_settings']['modules']['Contacts']['custom_before_save']['method'] = 'contactsBeforeSave';
$sugar_config['bulk_import_settings']['modules']['Accounts']['sugar_key_field'] = 'name';
$sugar_config['bulk_import_settings']['modules']['Accounts']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Accounts']['sql_query'] = 'select id from accounts where name = ?';
$sugar_config['bulk_import_settings']['modules']['Contacts']['sugar_key_field'] = 'id';
$sugar_config['bulk_import_settings']['modules']['Contacts']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Contacts']['sql_query'] = 'select id from contacts where id = ?';
$sugar_config['bulk_import_settings']['relationships']['Contacts']['accounts']['external_key_field_left'] = 'left_external_key';
$sugar_config['bulk_import_settings']['relationships']['Contacts']['accounts']['external_key_field_right'] = 'right_external_key';
```

### Customfields
Tests to make sure the functionality works fine also leveraging custom fields to store external unique keys.<br />
They do require everything mentioned on the Standard section, plus a custom field manually created with resulting name `externalkey_c` of type varchar 255 (TextField in Studio) and finally the additional config options for config_override.php below.
Run the tests with: `docker run -v ${PWD}/apitests:/tests -t -i thorn ./runtest.sh https://myurl.com/sugar adminuser adminpass /tests/customfields/`

#### config_override.php
To run the Customfields tests, the following additional configuration options are required:
```
$sugar_config['bulk_import_settings']['modules']['Cases']['sugar_key_field'] = 'externalkey_c';
$sugar_config['bulk_import_settings']['modules']['Cases']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Cases']['sql_query'] = 'select id_c from cases_cstm where externalkey_c = ?';
$sugar_config['bulk_import_settings']['relationships']['Cases']['contacts']['external_key_field_left'] = 'left_external_key';
$sugar_config['bulk_import_settings']['relationships']['Cases']['contacts']['external_key_field_right'] = 'right_external_key';
$sugar_config['bulk_import_settings']['relationships']['Cases']['accounts']['external_key_field_left'] = 'left_external_key';
$sugar_config['bulk_import_settings']['relationships']['Cases']['accounts']['external_key_field_right'] = 'right_external_key';
```
