# BulkImport Upsert API

The goal of this sample code is to be able to quickly create and/or update big amounts of data, by leveraging only REST API for integration and initial data load purposes.<br />
The code implements a POST based Bulk Upsert API for Sugar, that completes SQL lookups based on external system's unique keys and inserts or updates (upserts) multiple beans per HTTP request at once.

Please note that this sample code is not provided as an installable module, as extensive configuration is required (including creation of external data key fields) on a case by case scenario.

## Requirements
- Sugar 7.9 and above (it leverages database prepared statements syntax)

## Installation
- Deploy all provided files/folders within the custom Sugar folder
- Run a quick repair and rebuild for the custom API to be available on the system
- Create custom files/logic for module level special mappings after and before the save is processed wherever required (some samples are provided for Accounts, Contacts and Users on the current code)
- Create valid `config_override.php` settings to enable the custom API on a module per module level

<strong>Note that when the custom fields for the external keys are created (eg: ext_key_c), there has to be the matching index (eg: CREATE INDEX idx_users_ext_key ON users_cstm (ext_key_c); ) or the performance will terribly suffer while completing the lookups.</strong>

### Sample config_override.php
```
$sugar_config['bulk_import_settings']['modules']['Users']['sugar_key_field'] = 'ext_key_c';
$sugar_config['bulk_import_settings']['modules']['Users']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Users']['sql_query'] = 'select id_c from users_cstm where ext_key_c = ?';
$sugar_config['bulk_import_settings']['modules']['Accounts']['sugar_key_field'] = 'ext_key_c';
$sugar_config['bulk_import_settings']['modules']['Accounts']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Accounts']['sql_query'] = 'select id_c from accounts_cstm where ext_key_c = ?';
$sugar_config['bulk_import_settings']['modules']['Contacts']['sugar_key_field'] = 'ext_key_c';
$sugar_config['bulk_import_settings']['modules']['Contacts']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Contacts']['sql_query'] = 'select id_c from contacts_cstm where ext_key_c = ?';
$sugar_config['bulk_import_settings']['relationships']['Accounts']['contacts']['external_key_field_left'] = 'left_external_key';
$sugar_config['bulk_import_settings']['relationships']['Accounts']['contacts']['external_key_field_right'] = 'right_external_key';
$sugar_config['bulk_import_settings']['modules']['Documents']['sql_query'] = 'select id_c from documents_cstm where ext_key_c = ?';
$sugar_config['bulk_import_settings']['modules']['Documents']['sugar_key_field'] = 'ext_key_c';
$sugar_config['bulk_import_settings']['modules']['Documents']['external_key_field'] = 'external_key';
$sugar_config['bulk_import_settings']['modules']['Documents']['custom_before_save']['file'] = 'custom/modules/Documents/DocumentsBulkImport.php';
$sugar_config['bulk_import_settings']['modules']['Documents']['custom_before_save']['class'] = 'DocumentsBulkImport';
$sugar_config['bulk_import_settings']['relationships']['Documents']['accounts']['external_key_field_left'] = 'left_external_key';
$sugar_config['bulk_import_settings']['relationships']['Documents']['accounts']['external_key_field_right'] = 'right_external_key';
```

### config_override.php options explanation

```
$sugar_config['search_engine']['force_async_index'] = true; // OPTIONAL - Core Sugar configuration option to force Elasticsearch indexing to happen in the background, asynchronously, improving record save's speed

$sugar_config['bulk_import_settings']['modules'][<sugar module name>]['sugar_key_field'] = 'ext_key_c'; // OPTIONAL - sugar field name where the external key value will be stored for the module
$sugar_config['bulk_import_settings']['modules'][<sugar module name>]['external_key_field'] = 'external_key'; // REQUIRED - REST payload variable containing the external system unique key's value
$sugar_config['bulk_import_settings']['modules'][<sugar module name>]['sql_query'] = 'select id_c from accounts_cstm where ext_key_c = ?'; // REQUIRED - Sugar database sql query that will be executed for every record, to verify if the key passed on the payload exists already in the Sugar database or not, and also to find records for relationships linking

$sugar_config['bulk_import_settings']['modules'][<sugar module name>][<custom_after_save or custom_before_save>]['file'] = 'custom/modules/Accounts/AccountsBulkImport.php'; // OPTIONAL - path of custom file to load for the module
$sugar_config['bulk_import_settings']['modules'][<sugar module name>][<custom_after_save or custom_before_save>]['class'] = 'AccountsBulkImport'; // OPTIONAL - class to instantiate

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
- Best practice is to use an additional unique key field, with additional indexes (not the Sugar guid id field). If it is required to use the Sugar guid id field, leverage Sugar generated guids to populate the records correctly and not some other strings
- The system can be extended with its own hooks (before save and after save) when using the custom API (so no application logic hooks needed). The available config keys are `custom_before_save` and `custom_after_save`. The options that can be set are the `file` and the `class`. The method that will be called are either: `callCustomBeforeSave` or `callCustomAfterSave`
- To improve performance the activity stream record creation has been disabled and the tracker functionality paused when using the bulk API
- To improve performance further (and reduce server utilisation), make sure Elastic indexing does not happen synchronously with the config_override option provided `$sugar_config['search_engine']['force_async_index'] = true;`
- It is possible to upsert one record at the time only, by passing an array of records with only one record on the array. It is not recommended, as higher throughput can be achieved by passing multiple records
- It is possible to pass the parameter `"skipUpdate":true` on the REST request to prevent any record updates (including if the matching record is deleted). This is useful if as an example the initial data load was interrupted mid way. This option would allow to quickly resume the inserting of records without processing any update of previously created records. This additional parameter does not apply to relationships but only to bean's records
- Do not pass too many records at once to the API. Make sure every HTTP response does not take more than 15-20 seconds and monitor carefully the overall infrastructure load and the API response times
- A maximum amount of records is configured by default to 100. It can be configured through the `config_override.php` option `$sugar_config['bulk_import_settings']['max_records']`
- It is possible to impersonate another user for all the updates of the same request by passing on the payload the parameter `save_as_user_id` as the relevant user's guid
- For every record, it is possible to pass the list of its team guids separated by `|` with no added spaces on the field `team_list`. The first team in the list will be the primary Team. This functionality will only work correctly if all the Teams with the matching guids exist within the instance
- For every record, it is possible to populate `date_modified` and `date_entered`, as long as the date formats are correct (database format in GMT eg:`2013-02-27 19:56:00`)
- For every record, it is possible to populate `modified_user_id`, `created_by`, or based on external keys lookup with `external_modified_user_key`, `external_created_user_key` provided that the Users sugar guid exists and user impersonation is not active
- For every record, it is possible to populate `assigned_user_id` or based on external keys lookup with `external_assigned_user_key` provided that the Users sugar guids exist


### API Call Examples

#### Users (/rest/v10/BulkImport/records/Users)

```
{
    "records": [
        {
            "id": "47fecf72-b195-11e8-a6e1-06cd403c41f6",
            "first_name": "Test3",
            "last_name": "Test3",
            "user_name": "test3",
            "password": "test123",
            "email1": "test1@test.com",
            "status": "Active",
            "employee_status": "Active",
            "UserType": "RegularUser"
        },
        {
            "id": "47fed0f8-b195-11e8-9dde-06cd403c41f6",
            "first_name": "Test2",
            "last_name": "Test2",
            "user_name": "test2",
            "password": "test123",
            "email1": "test2@test.com",
            "status": "Active",
            "employee_status": "Active",
            "UserType": "RegularUser"
        }
    ]
}
```
#### Teams (/rest/v10/BulkImport/records/Teams)

```
{
    "records": [
        {
            "name": "Special Team 1",
            "external_key": "47fed1e8-b195-11e8-ccda-06cd403c41f6"
        },
        {
            "name": "Special Team 2",
            "external_key": "47fed1e8-b195-11e8-ccdb-06cd403c41f6"
        }
    ]
}
```

#### Users Teams relationships (/rest/v10/BulkImport/relationships/Teams/users)
```
{
    "records": [
        {
            "right_external_key": "test2",
            "left_external_key": "47fed1e8-b195-11e8-ccda-06cd403c41f6"
        },
        {
            "right_external_key": "test3",
            "left_external_key": "47fed1e8-b195-11e8-ccda-06cd403c41f6"
        },
        {
            "right_external_key": "test2",
            "left_external_key": "47fed1e8-b195-11e8-ccdb-06cd403c41f6"
        }
    ]
}
```

#### Accounts (/rest/v10/BulkImport/records/Accounts)
```
{
    "save_as_user_id": "47fed0f8-b195-11e8-9dde-06cd403c41f6",
    "records": [
        {
            "phone_office": "1234",
            "name": "a1",
            "external_key": "47fed1e8-b195-11e8-bbd3-06cd403c41f6",
            "external_assigned_user_key": "test3"
        },
        {
            "phone_office": "6789",
            "name": "a2",
            "external_key": "47fed21a-b195-11e8-87c3-06cd403c41f6",
            "external_assigned_user_key": "test3"
        }
    ]
}
```

#### Contacts (/rest/v10/BulkImport/records/Contacts)
```
{
    "records": [
        {
            "first_name": "c1",
            "last_name": "c1",
            "external_key": "47fed2b0-b195-11e8-865f-06cd403c41f6",
            "external_assigned_user_key": "test2",
            "date_entered": "2020-01-27 19:56:00",
            "date_modified": "2020-01-27 20:00:00",
            "modified_user_id": "47fed0f8-b195-11e8-9dde-06cd403c41f6",
            "created_by": "47fed0f8-b195-11e8-9dde-06cd403c41f6",
            "team_list": "47fed1e8-b195-11e8-ccda-06cd403c41f6|1"
        },
        {
            "first_name": "c2",
            "last_name": "c2",
            "external_key": "47fed2d8-b195-11e8-a8e5-06cd403c41f6",
            "external_assigned_user_key": "test2",
            "date_entered": "2020-01-27 19:56:00",
            "date_modified": "2020-01-27 20:00:00",
            "modified_user_id": "47fed0f8-b195-11e8-9dde-06cd403c41f6",
            "created_by": "47fed0f8-b195-11e8-9dde-06cd403c41f6",
            "team_list": "47fed1e8-b195-11e8-ccda-06cd403c41f6|1"
        }
    ]
}
```

#### Accounts Contacts relationships (/rest/v10/BulkImport/relationships/Accounts/contacts)
```
{
    "records": [
        {
            "right_external_key": "47fed2b0-b195-11e8-865f-06cd403c41f6",
            "left_external_key": "47fed1e8-b195-11e8-bbd3-06cd403c41f6"
        },
        {
            "right_external_key": "47fed2d8-b195-11e8-a8e5-06cd403c41f6",
            "left_external_key": "47fed1e8-b195-11e8-bbd3-06cd403c41f6"
        }
    ]
}
```

#### Cases (/rest/v10/BulkImport/records/Cases)
```
{
    "skipUpdate": true,
    "records": [
        {
            "name": "case1",
            "external_key": "47fed33c-b195-11e8-b939-06cd403c41f6",
            "external_assigned_user_key": "test3",
            "external_modified_user_key": "test3",
            "external_created_user_key": "test3",
            "date_entered": "2020-01-27 19:56:00",
            "date_modified": "2020-01-27 20:00:00",
            "team_list": "1|47fed1e8-b195-11e8-ccda-06cd403c41f6"
        },
        {
            "name": "case2",
            "external_key": "47fed36e-b195-11e8-b123-06cd403c41f6",
            "external_assigned_user_key": "test2",
            "external_modified_user_key": "test2",
            "external_created_user_key": "test2",
            "date_entered": "2020-01-27 19:56:00",
            "date_modified": "2020-01-27 20:00:00",
            "team_list": "1|47fed1e8-b195-11e8-ccda-06cd403c41f6"
        }
    ]
}
```

#### Cases Accounts relationships (/rest/v10/BulkImport/relationships/Cases/accounts)
```
{
    "records": [
        {
            "left_external_key": "47fed36e-b195-11e8-b123-06cd403c41f6",
            "right_external_key": "47fed21a-b195-11e8-87c3-06cd403c41f6"
        },
        {
            "left_external_key": "47fed33c-b195-11e8-b939-06cd403c41f6",
            "right_external_key": "47fed1e8-b195-11e8-bbd3-06cd403c41f6"
        }
    ]
}
```

#### Documents (/rest/v10/BulkImport/records/Documents)
```
{
    "records": [
        {
            "id": "4746a494-4e7c-11ea-9ce0-0242ac1c0005",
            "document_name": "document.pdf",
            "external_key": "1",
            "doc_type": "Sugar",
            "active_date": "2018-11-23",
            "exp_date": "2020-12-31"
        },
        {
            "id": "4748f078-4e7c-11ea-8dc6-0242ac1c0005",
            "document_name": "d2.jpg",
            "external_key": "2",
            "doc_type": "External",
            "doc_url": "https://location/d2.jpg"
        }
    ]
}
```

#### Documents Accounts relationships (/rest/v10/BulkImport/relationships/Documents/accounts)
```
{
  "records":[
    {
        "left_external_key":"1",
        "right_external_key":"47fed1e8-b195-11e8-bbd3-06cd403c41f6"
    },
    {
        "left_external_key":"2",
        "right_external_key":"47fed21a-b195-11e8-87c3-06cd403c41f6"
    }
  ]
}
```

### Notes on Documents

The API doesn't support loading document records directly. Rather for performance reasons we create the Document record and required version. This allows for fast processing when large amounts of Document records need to be migrated.

The API response includes the revision ID which will need to be used to rename the source file. This file needs to be placed in the upload directory of the instance at which time it will be available in the CRM instance. Alternatively it is possible to provide a pre-generated Sugar guid to the id field as on the above example.

For On-Premise installations these files can be copied directly to the upload directory via terminal commands or SFTP.

For SugarCloud installations there are 2 methods for transferring the actual Document files.

1. The recommended approach is to create a support ticket with SugarCRM to allow for uploading the documents to an FTP site. Note the files will still need to be in one folder with all the files stored in their Document GUID format. Additionally, this method should not be used for ongoing integrations but only for initial migrations for new instances.

2. For moderate numbers and sizes of files using one or more module loader packages is a convenient method to transfer the files. Note that each package compressed zip would have to be limited to the upload file max size of the instance. Typically this value is 32MB [See knowledge base for reference](http://support.sugarcrm.com/Knowledge_Base/Troubleshooting/Troubleshooting_Uploading_Large_Files/).
See example below for manifest and [see this page]( http://support.sugarcrm.com/SmartLinks/Developer_Guide/Cookbook/Module_Loadable_Packages) for more info on creating a module loader package.
```
 'copy' => array(
        array(
            'from' => '<basepath>/upload/4746a494-4e7c-11ea-9ce0-0242ac1c0005',
            'to' => 'upload/4746a494-4e7c-11ea-9ce0-0242ac1c0005'
        ),

    ),
```


For Documents that are stored outside of the CRM, populate the parameter `doc_url` with the url of the Document record and include the parameter 'doc_type' to be some value other than 'Sugar'.

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
        "id":"47fee372-b195-11e8-83be-06cd403c41f6"
    },
    {
        "name":"c2",
        "id":"47fee3a4-b195-11e8-bf63-06cd403c41f6"
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
        "external_key": "47fee372-b195-11e8-83be-06cd403c41f6",
        "sugar_id": "47fee372-b195-11e8-83be-06cd403c41f6"
      },
      {
        "external_key": "47fee3a4-b195-11e8-bf63-06cd403c41f6",
        "sugar_id": "47fee3a4-b195-11e8-bf63-06cd403c41f6"
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
        "external_key": "47fee372-b195-11e8-83be-06cd403c41f6",
        "sugar_id": "47fee372-b195-11e8-83be-06cd403c41f6",
        "message": "Module Cases update skipped as requested"
      },
      {
        "external_key": "47fee3a4-b195-11e8-bf63-06cd403c41f6",
        "sugar_id": "47fee3a4-b195-11e8-bf63-06cd403c41f6",
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
        "left_external_key":"47fee3a4-b195-11e8-bf63-06cd403c41f6",
        "right_external_key":"a3"
    },
    {
        "left_external_key":"47fee372-b195-11e8-83be-06cd403c41f6",
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
        "external_key_left": "47fee3a4-b195-11e8-bf63-06cd403c41f6",
        "sugar_id_left": "47fee3a4-b195-11e8-bf63-06cd403c41f6",
        "external_key_right": "a3",
        "sugar_id_right": "4b1ceac2-3ec8-11e7-8561-49cc98a30472"
      }
    ],
    "errors": [
      {
        "external_key_left": "47fee372-b195-11e8-83be-06cd403c41f6",
        "sugar_id_left": "47fee372-b195-11e8-83be-06cd403c41f6",
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
Copyright (c) 2018 SugarCRM Inc. Licensed by SugarCRM under the Apache 2.0 license.
