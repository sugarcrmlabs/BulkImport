# BulkImport Upsert API

The goal of this sample code is to be able to quickly create and/or update big amounts of data, by leveraging only REST API for integration and initial data load purposes for on-site implementations.<br />
The code implements a POST based Bulk Upsert API for Sugar, that completes SQL lookups based on external system's unique keys and inserts or updates (upserts) multiple beans per HTTP request at once.

Please note that this sample code is not provided as an installable module, as extensive configuration is required (including creation of external data key fields) on a case by case scenario.

## Requirements
- Sugar 7.9 and above (it leverages database prepared statements syntax)

## Installation
- Deploy all provided files/folders within the custom Sugar folder
- Run a quick repair and rebuild for the custom API to be available on the system
- Create custom files/logic for module level special mappings after and before the save is processed wherever required (some samples are provided for Accounts, Contacts and Users on the current code)
- Create valid `config_override.php` settings to enable the custom API on a module per module level

### Sample config_override.php
```
$sugar_config['search_engine']['force_async_index'] = true;

$sugar_config['bulk_import_settings']['modules']['Users']['sugar_key_field'] = 'ext_key_c';
$sugar_config['bulk_import_settings']['modules']['Users']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Users']['sql_query'] = 'select id_c from users_cstm where ext_key_c = ?';
$sugar_config['bulk_import_settings']['modules']['Users']['custom_after_save']['file'] = 'custom/modules/Users/UsersBulkImport.php';
$sugar_config['bulk_import_settings']['modules']['Users']['custom_after_save']['class'] = 'UsersBulkImport';
$sugar_config['bulk_import_settings']['modules']['Users']['custom_after_save']['method'] = 'usersAfterSave';
$sugar_config['bulk_import_settings']['modules']['Accounts']['custom_before_save']['file'] = 'custom/modules/Accounts/AccountsBulkImport.php';
$sugar_config['bulk_import_settings']['modules']['Accounts']['custom_before_save']['class'] = 'AccountsBulkImport';
$sugar_config['bulk_import_settings']['modules']['Accounts']['custom_before_save']['method'] = 'accountsBeforeSave';
$sugar_config['bulk_import_settings']['modules']['Contacts']['custom_before_save']['file'] = 'custom/modules/Contacts/ContactsBulkImport.php';
$sugar_config['bulk_import_settings']['modules']['Contacts']['custom_before_save']['class'] = 'ContactsBulkImport';
$sugar_config['bulk_import_settings']['modules']['Contacts']['custom_before_save']['method'] = 'contactsBeforeSave';
$sugar_config['bulk_import_settings']['modules']['Accounts']['sugar_key_field'] = 'ext_key_c';
$sugar_config['bulk_import_settings']['modules']['Accounts']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Accounts']['sql_query'] = 'select id_c from accounts_cstm where ext_key_c = ?';
$sugar_config['bulk_import_settings']['modules']['Contacts']['sugar_key_field'] = 'ext_key_c';
$sugar_config['bulk_import_settings']['modules']['Contacts']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Contacts']['sql_query'] = 'select id_c from contacts_cstm where ext_key_c = ?';
$sugar_config['bulk_import_settings']['relationships']['Contacts']['accounts']['external_key_field_left'] = 'left_external_key';
$sugar_config['bulk_import_settings']['relationships']['Contacts']['accounts']['external_key_field_right'] = 'right_external_key';

```

### config_override.php options explanation

```
$sugar_config['search_engine']['force_async_index'] = true; // OPTIONAL - Core Sugar configuration option to force Elasticsearch indexing to happen in the background, asynchronously, improving record save's speed

$sugar_config['bulk_import_settings']['modules'][<sugar module name>]['sugar_key_field'] = 'ext_key_c'; // OPTIONAL - sugar field name where the external key value will be stored for the module
$sugar_config['bulk_import_settings']['modules'][<sugar module name>]['external_key_field'] = 'external_key'; // REQUIRED - REST payload variable containing the external system unique key's value
$sugar_config['bulk_import_settings']['modules'][<sugar module name>]['sql_query'] = 'select id_c from accounts_cstm where ext_key_c = ?'; // REQUIRED - Sugar database sql query that will be executed for every record, to verify if the key passed on the payload exists already in the Sugar database or not, and also to find records for relationships linking

$sugar_config['bulk_import_settings']['modules'][<sugar module name>][<custom_after_save or custom_before_save>]['file'] = 'custom/modules/Accounts/AccountsBulkImport.php'; // OPTIONAL - path of custom file to load for the module
$sugar_config['bulk_import_settings']['modules'][<sugar module name>][<custom_after_save or custom_before_save>]['class'] = 'AccountsBulkImport'; // OPTIONAL - class to instantiate
$sugar_config['bulk_import_settings']['modules'][<sugar module name>][<custom_after_save or custom_before_save>]['method'] = 'accountsBeforeSave'; // OPTIONAL - method to execute

$sugar_config['bulk_import_settings']['relationships'][<sugar module name>][<sugar link field of relationship>]['external_key_field_left'] = 'left_external_key'; // REQUIRED - external key for the main module
$sugar_config['bulk_import_settings']['relationships'][<sugar module name>][<sugar link field of relationship>]['external_key_field_right'] = 'right_external_key'; // REQUIRED - external key for the related module

```

### Important Notes
- The API is only accessible to Admin Sugar users by design
- The API is only available for modules specifically configured on `config_override.php`
- When writing queries, do not filter out deleted records. The system will restore records as needed to prevent the otherwise possible unique key duplication
- When writing queries, the system expects to select only one field, either the `id` or `id_c` of the record, depending on the unique key location (core or custom table). In general a query would always look like the following example: `select <id or id_c> from <tablename> where <external key field> = ?` but there could be exceptions where joins and more complex queries are required
- The `sugar_key_field` config option could seem redundant, given that the sql query needs to be configured as well. In reality the `sugar_key_field` is used to make sure that the `external_key` value is set on the `sugar_key_field` field on the relevant object, so that it can be used later on for lookups leveraging the `sql_query` provided. The code will work also WITHOUT configuring `sugar_key_field`, but ONLY IF the external_key passed to the API as payload, matches the destination field where the external key will be stored in Sugar
- SQL queries lookups leverage prepared statements, so the question mark symbol `?` is required on the SQL syntax on `config_override.php`
- The system can be extended with its own hooks (before save and after save) when using the custom API (so no application logic hooks needed). The available config keys are `custom_before_save` and `custom_after_save`
- To improve performance the activity stream record creation has been disabled when using the bulk API
- To improve performance further (and reduce server utilisation), make sure Elastic indexing does not happen synchronously with the config_override option provided `$sugar_config['search_engine']['force_async_index'] = true;`
- It is possible to upsert one record at the time only, by passing an array of records with only one record on the array. It is not recommended, as higher throughput can be achieved by passing multiple records
- It is possible to pass the parameter `"skipUpdate":true` on the REST request to prevent any record updates (including if the matching record is deleted). This is useful if as an example the initial data load was interrupted mid way. This option would allow to quickly resume the inserting of records without processing any update of previously created records. This additional parameter does not apply to relationships but only to bean's records
- Do not pass too many records at once to the API. Make sure every HTTP response does not take more than 15-20 seconds and monitor carefully the overall infrastructure load and the API response times

### API Call Examples

#### Users (/rest/v10/BulkImport/records/Users)

```
{
  "records":[
    {
        "first_name":"Test1",
        "last_name":"Test1",
        "user_name":"u24",
        "password":"test123",
        "email1":"test1@test.com",
        "status":"Active",
        "employee_status":"Active",
        "UserType":"RegularUser",
        "external_key":"24"
    }
  ]
}
```

#### Accounts (/rest/v10/BulkImport/records/Accounts)
```
{
  "records":[
    {
        "name":"a1",
        "external_key":"1"
    },
    {
        "name":"a2",
        "external_key":"2"
    }
  ]
}
```

#### Contacts (/rest/v10/BulkImport/records/Contacts)
```
{
  "records":[
    {
        "first_name":"c1",
        "last_name":"c1",
        "external_key":"1"
    },
    {
        "first_name":"c2",
        "last_name":"c2",
        "external_key":"2"
    }
  ]
}
```


#### Accounts Contacts relationships (/rest/v10/BulkImport/relationships/Accounts/contacts)
```
{
  "records":[
    {
        "left_external_key":"1",
        "right_external_key":"2"
    },
    {
        "left_external_key":"2",
        "right_external_key":"1"
    }
  ]
}
```

#### Cases (/rest/v10/BulkImport/records/Cases)
```
{
  "skipUpdate":true,
  "records":[
    {
        "name":"c1",
        "external_key":"aaa-bbb-ccc-ddd-eee-1"
    },
    {
        "name":"c2",
        "external_key":"aaa-bbb-ccc-ddd-eee-2"
    }
  ]
}
```

#### Cases Accounts relationships (/rest/v10/BulkImport/relationships/Cases/accounts)
```
{
  "records":[
    {
        "left_external_key":"aaa-bbb-ccc-ddd-eee-2",
        "right_exteranl_key":"2"
    },
    {
        "left_external_key":"aaa-bbb-ccc-ddd-eee-1",
        "right_external_key":"1"
    }
  ]
}
```

#### Mixed response. Successful create, successful update and an error

```
{
  "records":[
    {
        "phone_office":"1234",
        "external_key":"a1"
    },
    {
        "phone_office":"6789",
        "external_key":"a3"
    },    
    {
        "phone_office":"6789",
        "external_key":""
    }
  ]
}
```

```
{
  "count": {
    "created": 1,
    "updated": 1,
    "errors": 1
  },
  "list": {
    "created": [
      {
        "external_key": "a3",
        "sugar_id": "aa095c18-3ec9-11e7-b0a0-37d830e68126"
      }
    ],
    "updated": [
      {
        "external_key": "a1",
        "sugar_id": "4b17a3a0-3ec8-11e7-8bdd-7a42aa821c97"
      }
    ],
    "errors": [
      {
        "message": "Module Accounts key: external_key empty"
      }
    ]
  }
}
```

#### Successful creation of records, with GUID stored on the Sugar id field, but generated outside Sugar. Skipping of updates implemented

```
{
  "skipUpdate":true,
  "records":[
    {
        "name":"c1",
        "id":"aaa-bbb-ccc-ddd-eee-1"
    },
    {
        "name":"c2",
        "id":"aaa-bbb-ccc-ddd-eee-2"
    }
  ]
}
```
```
{
  "count": {
    "created": 2
  },
  "list": {
    "created": [
      {
        "external_key": "aaa-bbb-ccc-ddd-eee-1",
        "sugar_id": "aaa-bbb-ccc-ddd-eee-1"
      },
      {
        "external_key": "aaa-bbb-ccc-ddd-eee-2",
        "sugar_id": "aaa-bbb-ccc-ddd-eee-2"
      }
    ]
  }
}
```
```
{
  "count": {
    "warnings": 2
  },
  "list": {
    "warnings": [
      {
        "external_key": "aaa-bbb-ccc-ddd-eee-1",
        "sugar_id": "aaa-bbb-ccc-ddd-eee-1",
        "message": "Module Cases update skipped as requested"
      },
      {
        "external_key": "aaa-bbb-ccc-ddd-eee-2",
        "sugar_id": "aaa-bbb-ccc-ddd-eee-2",
        "message": "Module Cases update skipped as requested"
      }
    ]
  }
}
```

#### Example of relationship API call with mixed response

```
{
  "records":[
    {
        "left_external_key":"aaa-bbb-ccc-ddd-eee-2",
        "right_external_key":"a3"
    },
    {
        "left_external_key":"aaa-bbb-ccc-ddd-eee-1",
        "right_external_key":"invalid-id"
    }
  ]
}
```
```
{
  "count": {
    "related": 1,
    "errors": 1
  },
  "list": {
    "related": [
      {
        "external_key_left": "aaa-bbb-ccc-ddd-eee-2",
        "sugar_id_left": "aaa-bbb-ccc-ddd-eee-2",
        "external_key_right": "a3",
        "sugar_id_right": "4b1ceac2-3ec8-11e7-8561-49cc98a30472"
      }
    ],
    "errors": [
      {
        "external_key_left": "aaa-bbb-ccc-ddd-eee-1",
        "sugar_id_left": "aaa-bbb-ccc-ddd-eee-1",
        "external_key_right": "invalid-id",
        "sugar_id_right": ""
      }
    ]
  }
}
```

## Contributing
Everyone is welcome to contribute to this project! If you make a contribution, then the [Contributor Terms](CONTRIBUTOR_TERMS.pdf) apply to your submission.

Please check out our [Contribution Guidelines](CONTRIBUTING.md) for helpful hints and tips that will make it easier for us to accept your pull requests.


-----
Copyright (c) 2016 SugarCRM Inc. Licensed by SugarCRM under the Apache 2.0 license.
